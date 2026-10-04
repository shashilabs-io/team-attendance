import { z } from 'zod';
export const attendanceFilterSchema = z.object({
    page: z.coerce.number().int().min(1, 'page must be at least 1').default(1),
    limit: z.coerce
        .number()
        .int()
        .min(1, 'limit must be at least 1')
        .max(100, 'limit cannot exceed 100')
        .default(20),
    userId: z.string().trim().optional(),
    registrationNo: z.string().trim().optional(),
    status: z
        .enum(['ACTIVE', 'COMPLETED'], {
        errorMap: () => ({
            message: "status must be either 'ACTIVE' or 'COMPLETED'",
        }),
    })
        .optional(),
    startDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'startDate must be a valid date string (e.g. YYYY-MM-DD)',
    })
        .optional(),
    endDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'endDate must be a valid date string (e.g. YYYY-MM-DD)',
    })
        .optional(),
});
export const statsFilterSchema = z.object({
    startDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'startDate must be a valid date string (e.g. YYYY-MM-DD)',
    })
        .optional(),
    endDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'endDate must be a valid date string (e.g. YYYY-MM-DD)',
    })
        .optional(),
});
export const eventFilterSchema = z.object({
    page: z.coerce.number().int().min(1, 'page must be at least 1').default(1),
    limit: z.coerce
        .number()
        .int()
        .min(1, 'limit must be at least 1')
        .max(100, 'limit cannot exceed 100')
        .default(20),
    userId: z.string().trim().optional(),
    type: z
        .enum(['CHECK_IN', 'CHECK_OUT'], {
        errorMap: () => ({
            message: "type must be either 'CHECK_IN' or 'CHECK_OUT'",
        }),
    })
        .optional(),
    startDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'startDate must be a valid date string (e.g. YYYY-MM-DD)',
    })
        .optional(),
    endDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'endDate must be a valid date string (e.g. YYYY-MM-DD)',
    })
        .optional(),
});
