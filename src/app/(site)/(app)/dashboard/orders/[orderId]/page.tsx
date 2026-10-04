import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/ui";
import { isUuid } from "@/server/http";
import { requireUserPage } from "@/server/auth";
import { userDb } from "@/lib/supabase/server";
import { OrderStatus } from "./OrderStatus";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order" };

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  await requireUserPage(`/dashboard/orders/${orderId}`);
  if (!isUuid(orderId)) notFound();
  const { data } = await (await userDb()).from("orders").select("id").eq("id", orderId).maybeSingle();
  if (!data) notFound();
  return (
    <PageShell narrow>
      <OrderStatus orderId={orderId} />
    </PageShell>
  );
}
