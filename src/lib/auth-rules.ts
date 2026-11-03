import { z } from "zod";

/** Account rules shared by the sign-in / sign-up / reset forms and the server. */

export const PASSWORD_MIN = 8;
/** bcrypt (Supabase Auth) only uses the first 72 bytes. */
export const PASSWORD_MAX = 72;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const emailSchema = z
  .string()
  .max(254)
  .transform((v) => v.trim().toLowerCase())
  .pipe(z.string().regex(EMAIL_RE, "Please enter a valid email address."));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  .refine((v) => new TextEncoder().encode(v).length <= PASSWORD_MAX, "That password is too long.");

export const signupSchema = z
  .object({ email: emailSchema, password: passwordSchema, confirm: z.string().max(400) })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords don't match." });

/** First problem with a new password + its confirmation, or null (client-side, same rules). */
export function passwordProblem(password: string, confirm: string): string | null {
  const r = passwordSchema.safeParse(password);
  if (!r.success) return r.error.issues[0]!.message;
  if (password !== confirm) return "The passwords don't match.";
  return null;
}
