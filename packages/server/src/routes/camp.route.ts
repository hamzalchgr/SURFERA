import express from 'express';
import type { Request, Response } from 'express';
import { pool } from '../config/db';
import { reservationSchema } from '../schemas/campSchema';
import { json } from 'zod';

const router = express.Router();

// GET ALL UPCOMING CAMPS
router.get('/camps/all', async (req: Request, res: Response) => {
   try {
      const { rows } = await pool.query(
         ` SELECT camp_id, start_date, end_date, (total_slots - booked_slots) AS slots_left FROM camps ORDER BY start_date ASC`
      );

      res.status(200).json({
         success: true,
         camps: rows,
      });
   } catch (error) {
      console.error('GET /camps/all:', error);
      return res
         .status(500)
         .json({ success: false, error: 'Internal server error.' });
   }
});

// CREATE A NEW RESERVATION
router.post('/reserve', async (req: Request, res: Response) => {
   const validationResult = reservationSchema.safeParse(req.body);

   if (!validationResult.success) {
      return res.status(400).json({
         success: false,
         error: validationResult.error.flatten().fieldErrors,
      });
   }

   const { name, email, start_date, room, note } = validationResult.data;

   const client = await pool.connect();

   try {
      await client.query('BEGIN');

      const campResult = await client.query(
         `
            SELECT 
               camp_id, 
               start_date, 
               end_date 
            FROM camps 
            WHERE start_date = $1`,
         [start_date]
      );

      if (campResult.rowCount === 0) {
         await client.query('ROLLBACK');

         return res.status(404).json({
            success: false,
            error: 'Camp not found.',
         });
      }

      const camp = campResult.rows[0];

      const roomPricingResult = await client.query(
         `SELECT 
               pricing_id, room_type, 
               price_eur, 
               total_slots, 
               booked_slots 
            FROM camp_room_pricing 
            WHERE camp_id = $1 
               AND room_type = $2 
            FOR UPDATE`,
         [camp.camp_id, room]
      );

      if (roomPricingResult.rowCount === 0) {
         await client.query('ROLLBACK');

         return res.status(404).json({
            success: false,
            error: 'Selected room is not available for this camp.',
         });
      }

      const roomPricing = roomPricingResult.rows[0];

      if (roomPricing.booked_slots >= roomPricing.total_slots) {
         await client.query('ROLLBACK');

         return res.status(409).json({
            success: false,
            error: 'No slots available for this room.',
         });
      }

      const camperResult = await client.query(
         `SELECT 
            camper_id 
         FROM campers 
         WHERE email = $1`,
         [email]
      );

      let camper_id: number;

      if (camperResult.rowCount === 0) {
         const newCamper = await client.query(
            `
               INSERT INTO campers (
                  name, email
               ) 
               VALUES ($1, $2)
               ON CONFLICT (email) DO NOTHING
               RETURNING camper_id`,
            [name, email]
         );

         camper_id = newCamper.rows[0].camper_id;
      } else {
         camper_id = camperResult.rows[0].camper_id;
      }

      const reservationResult = await client.query(
         `
            INSERT INTO reservations (
               camper_id,
               pricing_id,
               status,
               amount_due,
               note
            ) 
               VALUES ($1, $2, 'Confirmed', $3, $4) 
               RETURNING 
                  reservation_id,
                  camper_id,
                  pricing_id,
                  status,
                  amount_due,
                  note,
                  reserved_at
         `,
         [
            camper_id,
            roomPricing.pricing_id,
            roomPricing.price_eur,
            note ?? null,
         ]
      );

      await client.query(
         `
            UPDATE camp_room_pricing 
            SET booked_slots = booked_slots + 1 
            WHERE pricing_id = $1
         `,
         [roomPricing.pricing_id]
      );

      await client.query('COMMIT');

      return res.status(201).json({
         success: true,
         reservation: {
            reservation_id: reservationResult.rows[0].reservation_id,
            name,
            email,
            room: roomPricing.room_type,
            start_date: camp.start_date,
            end_date: camp.end_date,
            price: roomPricing.price_eur,
            status: 'Confirmed',
            note: note ?? null,
            reserved_at: reservationResult.rows[0].reserved_at,
         },
      });
   } catch (error) {
      await client.query('ROLLBACK');

      console.error('CREATE RESERVATION ERROR:', error);

      return res.status(500).json({
         success: false,
         message: 'Internal server error.',
      });
   } finally {
      client.release();
   }
});
