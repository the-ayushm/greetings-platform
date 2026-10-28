import { z } from "zod";
import { updateProduct } from "@/server/admin";
import { adminMutation, uuidParam } from "@/server/guards";
import { json, readJson, route } from "@/server/http";
import { cleanText } from "@/templates/scrapbook/schema";

export const dynamic = "force-dynamic";

const body = z.object({
  // ₹0 (free, e.g. while testing) or ₹1 – ₹1,00,000. Razorpay is never used for ₹0.
  pricePaise: z
    .number()
    .int()
    .refine((p) => p === 0 || (p >= 100 && p <= 10_000_000), "Price must be ₹0 or between ₹1 and ₹1,00,000")
    .optional(),
  isActive: z.boolean().optional(),
  editDays: z.number().int().min(1).max(3650).optional(),
  liveDays: z.number().int().min(1).max(3650).optional(),
  name: z
    .string()
    .max(320)
    .transform((v) => cleanText(v))
    .pipe(z.string().min(1).max(80))
    .optional(),
  description: z
    .string()
    .max(2000)
    .transform((v) => cleanText(v))
    .pipe(z.string().max(500))
    .optional(),
});

export const PATCH = route<{ productId: string }>(async (req, { params }) => {
  const admin = await adminMutation(req);
  return json(await updateProduct(admin.id, uuidParam((await params).productId), await readJson(req, body)));
});
