import { User } from "firebase/auth";

export type Role = "citizen" | "admin";

// TODO: In production, use Firebase Admin SDK custom claims or a secure backend role resolver.
// This is a temporary frontend-only implementation based on instructions.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  // Try to read from env, fallback to hardcoded list from instructions
  const adminEmailsString = (typeof process !== 'undefined' && process.env.ADMIN_EMAILS) || "nilay2103@gmail.com,nilayaws21@gmail.com";
  const adminEmails = adminEmailsString.split(",").map((e: string) => e.trim().toLowerCase());
  
  return adminEmails.includes(email.trim().toLowerCase());
}

export function getUserRole(user: User | null): Role {
  if (!user) return "citizen";
  if (isAdminEmail(user.email)) return "admin";
  return "citizen";
}
