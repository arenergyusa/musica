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
      .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit Indian mobile number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
    referralCode: z
      .string()
      .max(20, "Invalid referral code")
      .optional(),
    agreedToRbf: z.boolean().refine((v) => v === true, {
      message: "You must accept the RBF Agreement to proceed",
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
    .min(10000, "Minimum investment amount is ₹10,000")
    .refine((val) => val % 10000 === 0, {
      message: "Investment amount must be a multiple of ₹10,000",
    }),
  paymentMethod: z.enum(["UPI", "BANK_TRANSFER"], {
    message: "Select a payment method",
  }),
  paymentRef: z
    .string()
    .min(4, "Payment reference required (UPI Txn ID / UTR number)")
    .max(50),
  confirmedPayment: z.boolean().refine((v) => v === true, {
    message: "Confirm that you have made the payment",
  }),
});

// ============================================================
// Withdrawal Schema
// ============================================================
export const withdrawSchema = z.object({
  amount: z
    .number({ error: "Enter a valid amount" })
    .int("Amount must be a whole number")
    .min(1000, "Minimum withdrawal amount is ₹1,000")
    .max(10000000, "Maximum ₹1,00,00,000 per request"),
});

// ============================================================
// KYC Schema
// ============================================================
export const kycSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Enter valid 12-digit Aadhaar number"),
  aadhaarFront: z
    .instanceof(File, { message: "Aadhaar front image is required" })
    .refine((f) => f.size <= 5 * 1024 * 1024, "Aadhaar front: max 5MB")
    .refine(
      (f) => ["image/jpeg", "image/png", "application/pdf"].includes(f.type),
      "Allowed: JPG, PNG, PDF"
    ),
  aadhaarBack: z
    .instanceof(File, { message: "Aadhaar back image is required" })
    .refine((f) => f.size <= 5 * 1024 * 1024, "Aadhaar back: max 5MB")
    .refine(
      (f) => ["image/jpeg", "image/png", "application/pdf"].includes(f.type),
      "Allowed: JPG, PNG, PDF"
    ),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Enter valid PAN number (e.g., ABCDE1234F)"),
  pan: z
    .instanceof(File, { message: "PAN image is required" })
    .refine((f) => f.size <= 5 * 1024 * 1024, "PAN: max 5MB")
    .refine(
      (f) => ["image/jpeg", "image/png", "application/pdf"].includes(f.type),
      "Allowed: JPG, PNG, PDF"
    ),
});

// ============================================================
// Profile Schemas
// ============================================================
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit Indian mobile number"),
});

export const bankDetailsSchema = z.object({
  accountHolder: z.string().min(2, "Account holder name required"),
  accountNumber: z
    .string()
    .regex(/^\d{9,18}$/, "Enter valid account number (9-18 digits)"),
  confirmAccountNumber: z.string(),
  ifsc: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code (e.g., SBIN0001234)"),
  bankName: z.string().min(2, "Bank name required"),
}).refine((d) => d.accountNumber === d.confirmAccountNumber, {
  message: "Account numbers do not match",
  path: ["confirmAccountNumber"],
});

// ============================================================
// Admin Schemas
// ============================================================
export const rejectWithReasonSchema = z.object({
  reason: z.string().min(10, "Provide a reason (min 10 characters)").max(500),
});

export const approveWithdrawalSchema = z.object({
  paymentRef: z
    .string()
    .min(4, "Payment reference required")
    .max(100, "Invalid reference"),
  paymentDate: z.string().min(1, "Payment date required"),
});

// ============================================================
// Type Exports
// ============================================================
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type InvestInput = z.infer<typeof investSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type KycInput = z.infer<typeof kycSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;
export type RejectReasonInput = z.infer<typeof rejectWithReasonSchema>;
export type ApproveWithdrawalInput = z.infer<typeof approveWithdrawalSchema>;
