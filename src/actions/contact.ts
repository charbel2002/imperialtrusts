"use server";

import { contactSchema } from "@/lib/validations";
import {
  sendContactConfirmationEmail,
  sendContactFormToAdmin,
} from "@/lib/email";

export async function submitContactForm(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  locale?: string;
}) {
  const validated = contactSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { name, email, subject, message } = validated.data;

  // Send confirmation to the user
  await sendContactConfirmationEmail({ to: email, name, subject, lang: data.locale });

  // Forward the message to the admin / support team
  await sendContactFormToAdmin({ name, email, subject, message });

  return { success: true };
}
