import jwt from 'jsonwebtoken';

export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET_KEY) {
   throw new Error(
      'CRITICAL CONFIGURATION ERROR: JWT_SECRET_KEY environment variable is not defined.'
   );
}

export const generateToken = (user_id: string): string => {
   return jwt.sign({ user_id }, JWT_SECRET_KEY, { expiresIn: '7d' });
};
