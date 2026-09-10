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

