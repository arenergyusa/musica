import { z } from "zod";

// ============================================================
// Auth Schemas
// ============================================================
export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
    referralCode: z
      .string()
      .trim()
      .min(1, "Invite code is required")
      .max(30, "Invalid invite code"),
    agreedToRbf: z.boolean().refine((v) => v === true, {
      message: "You must accept the terms to proceed",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ============================================================
// Investment Schema
// ============================================================
export const investSchema = z.object({
  amount: z
    .number({ message: "Amount must be a valid number" })
    .min(100, "Minimum investment amount is $100")
    .max(10000, "Maximum investment amount is $10,000")
    .refine((val) => val % 100 === 0, {
      message: "Investment amount must be a multiple of $100",
    }),
  paymentMethod: z.string().optional(),
  paymentRef: z.string().optional(),
  confirmedPayment: z.boolean().refine((v) => v === true, {
    message: "Confirm that you have completed the USDT transfer",
  }),
});

// ============================================================
// Withdrawal Schema
// ============================================================
export const withdrawSchema = (min: number = 10) =>
  z.object({
    amount: z
      .number({ error: "Enter a valid amount" })
      .min(min, `Minimum withdrawal amount is $${min}`),
  });

// ============================================================
// Profile & USDT Address Schemas
// ============================================================
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
});

export const usdtAddressSchema = z.object({
  usdtAddress: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Enter valid BSC BEP-20 address (0x...)"),
});

// ============================================================
// Admin Schemas
// ============================================================
export const rejectWithReasonSchema = z.object({
  reason: z.string().min(10, "Provide a reason (min 10 characters)").max(500),
});

export const approveWithdrawalSchema = z.object({
  adminNote: z
    .string()
    .trim()
    .optional()
    .refine((v) => v === undefined || v.length <= 500, {
      message: "Admin note must be at most 500 characters",
    }),
});

// ============================================================
// Type Exports
// ============================================================
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type InvestInput = z.infer<typeof investSchema>;
export type WithdrawInput = z.infer<ReturnType<typeof withdrawSchema>>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UsdtAddressInput = z.infer<typeof usdtAddressSchema>;
export type RejectReasonInput = z.infer<typeof rejectWithReasonSchema>;
export type ApproveWithdrawalInput = z.infer<typeof approveWithdrawalSchema>;
