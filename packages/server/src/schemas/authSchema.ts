import z from 'zod';

const emailSchema = z
   .string()
   .trim()
   .toLowerCase()
   .email({ message: 'Please enter a valid email address.' });

const passwordSchema = z
   .string()
   .trim()
   .min(8, { message: 'Password must be at least 8 characters long.' })
   .max(20, { message: 'Password cannot exceed 20 characters.' })
   .regex(/[A-Z]/, {
      message: 'Password must contain at least one uppercase letter.',
   })
   .regex(/[0-8]/, { message: 'Password must contain at least one number.' });

export const signUpSchema = z.object({
   name: z
      .string()
      .trim()
      .min(1, { message: 'Name is required' })
      .max(50, { message: 'Name cannot exceed 50 characters.' }),

   email: emailSchema,
   password: passwordSchema,
});

export const signInSchema = z.object({
   email: emailSchema,
   password: passwordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
