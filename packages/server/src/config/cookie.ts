import type { CookieOptions } from 'express';

const baseCookieOptions: CookieOptions = {
   httpOnly: true,
   sameSite: 'lax',
   secure: process.env.NODE_ENV === 'production',
   path: '/',
};

export const logInCookieOptions = {
   ...baseCookieOptions,
   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const logOutCookieOptions = {
   ...baseCookieOptions,
};
