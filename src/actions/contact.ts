"use server";

import { contactSchema } from "@/lib/validations";

export async function submitContactForm(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const validated = contactSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  // In production: send email via nodemailer/resend/etc.
  // For now, just return success.
  return { success: true };
}
