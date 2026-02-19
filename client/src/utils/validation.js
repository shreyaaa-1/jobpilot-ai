import { z } from 'zod'

/* ================= AUTH ================= */

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address'),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters'),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Invalid email address'),

    password: z
      .string()
      .trim()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[0-9]/, 'Password must contain number'),

    confirmPassword: z
      .string()
      .trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

/* ================= JOB ================= */

export const jobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters'),

    description: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),

    company: z
      .string()
      .trim()
      .min(2, 'Company name must be at least 2 characters'),

    location: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),

    jobLink: z
      .string()
      .trim()
      .url('Please enter a valid URL')
      .optional()
      .or(z.literal('')),

    salary_min: z
      .union([z.coerce.number().positive('Minimum salary must be positive'), z.nan()])
      .optional(),

    salary_max: z
      .union([z.coerce.number().positive('Maximum salary must be positive'), z.nan()])
      .optional(),
  })
  .refine((data) => {
    if (!Number.isFinite(data.salary_min) || !Number.isFinite(data.salary_max)) {
      return true;
    }
    return data.salary_max >= data.salary_min;
  }, {
    message: 'Max salary must be greater than or equal to min salary',
    path: ['salary_max'],
  })

/* ================= HELPERS (optional) ================= */

export const emailValidator = (email) =>
  z.string().email().safeParse(email).success

export const passwordValidator = (password) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[0-9]/.test(password)
