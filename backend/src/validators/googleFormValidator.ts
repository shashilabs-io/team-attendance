import { z } from 'zod';

export const googleFormAttendanceSchema = z.object({
  registrationNo: z
    .string({
      required_error: 'Registration number is required',
      invalid_type_error: 'Registration number must be a string',
    })
    .trim()
    .min(1, 'Registration number cannot be empty'),

  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .trim()
    .min(1, 'Name cannot be empty'),

  action: z
    .string({
      required_error: 'Attendance action is required',
    })
    .trim()
    .transform((val) => {
      // Normalize 'CHECK IN', 'check in', 'check-in', 'CHECKIN' -> 'CHECK_IN'
      const normalized = val.toUpperCase().replace(/[\s-]+/g, '_');
      return normalized;
    })
    .refine((val): val is 'CHECK_IN' | 'CHECK_OUT' => val === 'CHECK_IN' || val === 'CHECK_OUT', {
      message: 'Invalid action. Must be CHECK_IN or CHECK_OUT',
    }),

  task: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
  submissionId: z.string().trim().optional(),
  submittedAt: z.string().trim().optional(),
});

export type GoogleFormAttendancePayload = z.infer<typeof googleFormAttendanceSchema>;
