// Draft policy text written for this product. It must be reviewed by a lawyer and the
// [bracketed] business details filled in before going live (Razorpay KYC requires these pages).

export type LegalDoc = "terms" | "privacy" | "refund" | "delivery";
type Doc = { title: string; updated: string; sections: [string, string[]][] };

const UPDATED = "5 October 2026";

export const LEGAL: Record<LegalDoc, Doc> = {
  terms: {
    title: "Terms of Service",
    updated: UPDATED,
    sections: [
      ["Who we are", ["Birthday Surprise is operated by [Business legal name], [registered address], India (“we”, “us”). Contact: [support email]."]],
      ["What you buy", ["A licence to create one personal birthday website from our template, editable for 30 days after purchase and available online for 1 year after purchase, for personal, non-commercial use."]],
      [
        "Your content",
        [
          "You keep ownership of the text, photos and audio you upload. You give us permission to store, process and display them only to provide your website.",
          "You confirm that you have the right to use everything you upload, including permission from people shown in photos and the right to share any song privately. Do not upload anything illegal, hateful, sexually explicit, or that infringes someone else's rights.",
        ],
      ],
      ["Private links", ["Anyone who has your link (and passcode, if you set one) can view your website. Share it only with people you trust. You can change the link, add a passcode, unpublish or delete the site at any time."]],
      ["Removal", ["We may disable a website that breaks these terms or that we receive a valid legal or copyright complaint about. If we disable a site for a policy breach, no refund is due."]],
      ["Our artwork", ["The template design, illustrations, animations, fonts and code remain ours or our licensors'. You may not copy or resell them."]],
      ["Liability", ["The service is provided as is. To the extent allowed by law, our total liability is limited to the amount you paid for the affected website."]],
      ["Law", ["These terms are governed by the laws of India. Courts at [city] have jurisdiction."]],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: UPDATED,
    sections: [
      ["Summary", ["We collect only what we need to make your birthday website, keep it private, and process your payment. We don't sell data, and the birthday page has no ads or trackers."]],
      [
        "What we collect",
        [
          "Account: your email address (to sign in with a one-time code).",
          "Your website: the names, messages, photos and song you add. Photos have location and camera data removed when uploaded.",
          "Payments: order amounts and Razorpay payment references. Card, UPI and bank details are handled by Razorpay, not us.",
          "Basic records: how many times your page was opened, and security logs (with IP addresses replaced by one-way hashes).",
        ],
      ],
      ["Who can see your website", ["Only people with the link (and passcode, if set). Pages are hidden from search engines. Our staff can't see your content in normal operation; access for safety or legal reasons is restricted and logged."]],
      ["Processors", ["Supabase (database and file storage, Mumbai region), Vercel (hosting), Razorpay (payments), and our email provider (sign-in codes)."]],
      ["How long we keep it", ["Your website and files: until you delete them, or 30 days after the site expires. Payment records: as long as tax law requires (without your name or email after you delete your account)."]],
      [
        "Your rights",
        [
          "Under India's Digital Personal Data Protection Act, 2023 you can access, correct and erase your data. Download your data and delete your account from the Account page, or email [privacy email]. Grievance officer: [name, email].",
        ],
      ],
    ],
  },
  refund: {
    title: "Refund & Cancellation Policy",
    updated: UPDATED,
    sections: [
      ["Before you publish", ["If you change your mind within 7 days of purchase and have not published your website, email [support email] with your order ID for a full refund."]],
      ["Technical problems", ["If your website doesn't work and we can't fix it within 5 working days, we'll refund you in full."]],
      ["Duplicate payments", ["If you're accidentally charged twice for the same order, the extra payment is refunded automatically."]],
      ["How refunds work", ["Refunds go back to the original payment method through Razorpay, usually within 5–7 working days. When an order is refunded, its website is switched off."]],
      ["Not refundable", ["Websites that have been published and shared, except for technical problems as above, or sites disabled for breaking our terms."]],
    ],
  },
  delivery: {
    title: "Delivery Policy",
    updated: UPDATED,
    sections: [
      ["Digital delivery", ["This is a digital product. There is no physical shipping. Your website is created automatically as soon as your payment is confirmed — usually within a few seconds — and appears in My sites."]],
      ["If it doesn't appear", ["If your payment succeeded but no site appears within 30 minutes, email [support email] with your order ID. Our system also re-checks unconfirmed payments every few minutes."]],
    ],
  },
};
