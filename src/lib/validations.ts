import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "validation.nameMin"),
    email: z.string().email("validation.invalidEmail"),
    password: z.string().min(8, "validation.passwordMin"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "validation.passwordMismatch",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("validation.invalidEmail"),
  password: z.string().min(1, "validation.passwordRequired"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("validation.invalidEmail"),
});

export const contactSchema = z.object({
  name: z.string().min(2, "validation.nameRequired"),
  email: z.string().email("validation.invalidEmailShort"),
  subject: z.string().min(2, "validation.subjectRequired"),
  message: z.string().min(10, "validation.messageMin"),
});

export const loanApplicationSchema = z.object({
  email: z.string().email("validation.invalidEmailShort"),
  amount: z.number().min(500).max(500000),
  durationMonths: z.number().int().min(3).max(120),
  interestRate: z.number().min(0).max(30),
});

export const beneficiarySchema = z.object({
  name: z.string().min(2),
  bankName: z.string().min(2),
  accountNumber: z.string().min(4),
  swift: z.string().optional(),
  country: z.string().min(2),
});

export const transferSchema = z.object({
  beneficiaryId: z.string().min(1, "validation.selectBeneficiary"),
  amount: z.number().positive("validation.amountPositive"),
  description: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;
export type BeneficiaryInput = z.infer<typeof beneficiarySchema>;
export const kycSubmissionSchema = z.object({
  fullLegalName: z.string().min(2, "validation.fullNameRequired"),
  dateOfBirth: z.string().min(1, "validation.dobRequired"),
  address: z.string().min(5, "validation.addressMin"),
  nationalId: z.string().min(3, "validation.nationalIdRequired"),
});

export const kycReviewSchema = z.object({
  kycId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;
export type KycSubmissionInput = z.infer<typeof kycSubmissionSchema>;
export type KycReviewInput = z.infer<typeof kycReviewSchema>;

export const adminCreditDebitSchema = z.object({
  accountId: z.string().min(1, "validation.accountRequired"),
  amount: z.number().positive("validation.amountPositive"),
  description: z.string().min(2, "validation.descriptionRequired"),
  type: z.enum(["credit", "debit"]),
});

export const accountStatusSchema = z.object({
  accountId: z.string().min(1),
  status: z.enum(["ACTIVE", "LOCKED", "SUSPENDED"]),
});

export type AdminCreditDebitInput = z.infer<typeof adminCreditDebitSchema>;
export type AccountStatusInput = z.infer<typeof accountStatusSchema>;

export const createCardSchema = z.object({
  cardType: z.enum(["VISA", "MASTERCARD"]),
});

export const fundCardSchema = z.object({
  cardId: z.string().min(1),
  amount: z.number().positive("validation.amountPositive"),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type FundCardInput = z.infer<typeof fundCardSchema>;
