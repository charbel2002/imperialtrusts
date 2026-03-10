"use client";

import { useState } from "react";
import { submitContactForm } from "@/actions/contact";
import { translateActionError } from "@/lib/translate-error";
import { Input, Textarea, Alert } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export function ContactForm({ dict }: { dict: Record<string, any> }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const t = dict.contact;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const result = await submitContactForm({
      name: form.get("name") as string, email: form.get("email") as string,
      subject: form.get("subject") as string, message: form.get("message") as string,
      locale: dict._locale,
    });
    setLoading(false);
    if (result.error) setError(translateActionError(result.error, dict)); else setSent(true);
  }

  if (sent) {
    return (
      <Alert variant="success">
        <CheckCircle size={20} className="flex-shrink-0" />
        <div><p className="font-medium">{t.successTitle}</p><p className="text-sm mt-0.5">{t.successMsg}</p></div>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="grid sm:grid-cols-2 gap-5">
        <Input name="name" label={t.name} placeholder="John Doe" required />
        <Input name="email" type="email" label={t.emailField} placeholder="john@example.com" required />
      </div>
      <Input name="subject" label={t.subject} placeholder="..." required />
      <Textarea name="message" label={t.message} placeholder="..." rows={5} required />
      <Button type="submit" loading={loading}>{t.send}</Button>
    </form>
  );
}
