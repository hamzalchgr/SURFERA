import z from 'zod';

export const reservationSchema = z.object({
   name: z
      .string()
      .trim()
      .min(1, { message: 'Name is required.' })
      .max(50, { message: 'Name cannot exceed 50 characters.' }),

   email: z
      .string()
      .trim()
      .toLowerCase()
      .email({ message: 'Please enter a valid email.' }),

   start_date: z.coerce.date(),

   room: z.enum(['Shared room', 'Private room', 'Couple package']),

   note: z.string().max(1000).optional(),
});

export type reservationInput = z.infer<typeof reservationSchema>