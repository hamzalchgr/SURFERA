import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET_KEY } from '../utils/token';

export const protect = (req: Request, res: Response, next: NextFunction) => {
   try {
      const accessToken = req.cookies?.token;

      if (!accessToken) {
         return res.status(401).json({
            success: false,
            error: 'Authentication required. Please log in.',
         });
      }

      const decoded = jwt.verify(accessToken, JWT_SECRET_KEY!) as JwtPayload & {
         user_id: string;
      };

      req.user = {
         user_id: decoded.user_id,
      };

      return next();
   } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
         return res.status(401).json({
            success: false,
            error: 'Your session has expired. Please log in again.',
         });
      }

      if (error instanceof jwt.JsonWebTokenError) {
         return res.status(401).json({
            success: false,
            error: 'Invalid authentication token.',
         });
      }
      console.error(error);
      return res.status(500).json({
         success: false,
         error: 'Internal server error.',
      });
   }
};
