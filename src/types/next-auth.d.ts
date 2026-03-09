import { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      language: string;
      accountNumber: string | null;
    };
  }

  interface User {
    id: string;
    role: Role;
    language: string;
    accountNumber: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    language: string;
    accountNumber: string | null;
  }
}
