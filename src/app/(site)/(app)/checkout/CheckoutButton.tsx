"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Notice } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (ev: "payment.failed", fn: (r: { error?: { description?: string } }) => void) => void };
type RazorpayCtor = new (opts: Record<string, unknown>) => RazorpayInstance;
declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

function loadCheckoutScript(): Promise<RazorpayCtor> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("unavailable")));
    s.onerror = () => reject(new Error("unavailable"));
    document.head.appendChild(s);
  });
}

type Session = { orderId: string; razorpayOrderId: string; amount: number; currency: string; keyId: string; productName: string };

export function CheckoutButton({ productId, email, label }: { productId: string; email: string; label: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "starting" | "open" | "verifying">("idle");
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setError(null);
    setState("starting");
    let session: Session;
    let Razorpay: RazorpayCtor;
    try {
      [session, Razorpay] = await Promise.all([api<Session>("/api/checkout", { method: "POST", body: { productId } }), loadCheckoutScript()]);
    } catch (e) {
      setState("idle");
      setError(e instanceof ApiFailure ? e.message : "Payments couldn't load. Check your connection and try again.");
      return;
    }
    const rzp = new Razorpay({
      key: session.keyId,
      order_id: session.razorpayOrderId,
      amount: session.amount,
      currency: session.currency,
      name: "Birthday Surprise",
      description: session.productName,
      prefill: { email },
      theme: { color: "#d2475f" },
      modal: { ondismiss: () => setState("idle"), confirm_close: true },
      handler: async (resp: RazorpayResponse) => {
        setState("verifying");
        try {
          await api("/api/checkout/verify", { method: "POST", body: resp });
        } catch {
          // The webhook will still confirm the payment; the order page waits for it.
        }
        router.push(`/dashboard/orders/${session.orderId}`);
      },
    });
    rzp.on("payment.failed", (r) => {
      const reason = r.error?.description?.trim().replace(/[.\s]+$/, "");
      setError(reason ? `Payment failed: ${reason}. You haven't been charged — you can try again.` : "Payment failed. You haven't been charged — you can try again.");
    });
    setState("open");
    rzp.open();
  }

  return (
    <div className="mt-6 space-y-3">
      {error && <Notice tone="error">{error}</Notice>}
      <Button onClick={pay} disabled={state !== "idle"} className="w-full" data-testid="pay">
        {state === "starting" ? "Starting secure payment…" : state === "verifying" ? "Confirming payment…" : label}
      </Button>
      <p className="text-center text-xs text-ink-soft">Secure payment by Razorpay · UPI, cards, netbanking, wallets</p>
    </div>
  );
}
