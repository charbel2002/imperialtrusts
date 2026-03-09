import type { Metadata } from "next";
import ClientPage from "./_client";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function Page() {
  return <ClientPage />;
}
