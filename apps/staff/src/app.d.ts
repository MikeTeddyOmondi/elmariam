import type { Role } from '@elmariam/auth';

declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        email: string;
        userType: Role;
      } | undefined;
    }
  }
}

export {};
