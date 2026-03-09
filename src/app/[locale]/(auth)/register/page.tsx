import type { Metadata } from "next";
import ClientPage from "./_client";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function Page() {
  return <ClientPage />;
}
