import express from 'express';
import type { Request, Response } from 'express';
import { signInSchema, signUpSchema } from '../schemas/authSchema';
import { pool } from '../config/db';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/token';
import { logInCookieOptions, logOutCookieOptions } from '../config/cookie';
import { protect } from '../middleware/auth';

const router = express.Router();

// SIGN UP
router.post('/signup', async (req: Request, res: Response) => {
   const validationResult = signUpSchema.safeParse(req.body);

   if (!validationResult.success) {
      return res.status(400).json({
         success: false,
         error: validationResult.error.flatten().fieldErrors,
      });
   }

   const { name, email, password } = validationResult.data;

   try {
      const hashPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
         `
         INSERT INTO users (
            name, email, password
         ) VALUES ( $1, $2, $3 ) RETURNING user_id, name, email, created_at
      `,
         [name, email, hashPassword]
      );

      const newUser = result.rows[0];
      if (!newUser) {
         throw new Error(
            'Database failed to return the newly created user record.'
         );
      }

      const accessToken = generateToken(newUser.user_id);
      res.cookie('token', accessToken, logInCookieOptions);

      return res.status(201).json({
         message: 'User added successfully.',
         newUser,
      });
   } catch (error: any) {
      if (error?.code === '23505') {
         return res.status(409).json({
            success: false,
            error: 'Email already exists.',
         });
      }

      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
   }
});

// SIGN IN
router.post('/signin', async (req: Request, res: Response) => {
   const validationResult = signInSchema.safeParse(req.body);

   if (!validationResult.success) {
      return res.status(400).json({
         success: false,
         error: validationResult.error.flatten().fieldErrors,
      });
   }

   const { email, password } = validationResult.data;

   try {
      const userResult = await pool.query(
         `
            SELECT user_id, name, email, password, created_at FROM users WHERE email = $1
         `,
         [email]
      );

      if (!userResult.rowCount) {
         return res.status(401).json({
            success: false,
            error: 'Invalid email or password.',
         });
      }

      const user = userResult.rows[0];

      const comparePassword = await bcrypt.compare(password, user.password);

      if (!comparePassword) {
         return res.status(401).json({
            success: false,
            error: 'Invalid email or password.',
         });
      }

      const accessToken = generateToken(user.user_id);
      res.cookie('token', accessToken, logInCookieOptions);

      return res.status(200).json({
         success: true,
         message: 'Logged in successfully.',
         user: {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
         },
      });
   } catch (error) {
      console.error(error);
      return res.status(500).json({
         success: false,
         error: 'Internal server error.',
      });
   }
});

// SIGN OUT
router.post('/logout', (req: Request, res: Response) => {
   res.clearCookie('token', logOutCookieOptions);
   return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
   });
});

// ME
router.get('/account', protect, (req: Request, res: Response) => {
   const user_id = req.user?.user_id;

   return res.status(200).json({ user_id });
});

export default router;
