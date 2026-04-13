import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createTransport } from "nodemailer";
import fs from "fs/promises";
import handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendMail({
  to,
  subject,
  templateName,
  context,
}: {
  to: string;
  subject: string;
  templateName: string;
  context: Record<string, unknown>;
}) {
  try {
    const templatePath = path.join(
      __dirname,
      "./templates",
      `${templateName}.hbs`,
    );
    const templateSource = await fs.readFile(templatePath, "utf-8");
    const compiledTemplate = handlebars.compile(templateSource);

    await transporter.sendMail({
      from: `"Eventura" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html: compiledTemplate(context),
    });

    console.log(`[MAIL] ✓ Sent "${subject}" to ${to}`);
  } catch (err) {
    // Log but don't throw — email failure shouldn't break the main flow
    console.error(`[MAIL] ✗ Failed to send "${subject}" to ${to}:`, err);
  }
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function sendWelcomeEmail(user: {
  email: string;
  name: string;
  role: string;
  referralCode: string;
}) {
  await sendMail({
    to: user.email,
    subject: "Selamat Datang di Eventura! 🎉",
    templateName: "welcome",
    context: {
      name: user.name,
      role: user.role === "ORGANIZER" ? "Organizer" : "Customer",
      referralCode: user.referralCode,
      baseUrl: BASE_URL,
    },
  });
}

export async function sendTransactionCreatedEmail(data: {
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  eventName: string;
  eventDate: Date | string;
  eventVenue: string;
  items: { ticketName: string; quantity: number; subtotal: number }[];
  voucherCode?: string;
  voucherDiscount?: number;
  pointsUsed?: number;
  finalPrice: number;
  paymentDeadline: Date | string;
  transactionId: string;
}) {
  await sendMail({
    to: data.customerEmail,
    subject: `Transaksi ${data.invoiceNumber} — Selesaikan Pembayaran`,
    templateName: "transaction-created",
    context: {
      customerName: data.customerName,
      invoiceNumber: data.invoiceNumber,
      eventName: data.eventName,
      eventDate: formatDate(data.eventDate),
      eventVenue: data.eventVenue,
      items: data.items.map((i) => ({
        ...i,
        subtotal: formatPrice(i.subtotal),
      })),
      voucherCode: data.voucherCode,
      voucherDiscount: data.voucherDiscount
        ? formatPrice(data.voucherDiscount)
        : undefined,
      pointsUsed: data.pointsUsed ? formatPrice(data.pointsUsed) : undefined,
      finalPrice: formatPrice(data.finalPrice),
      paymentDeadline: formatDate(data.paymentDeadline),
      transactionId: data.transactionId,
      baseUrl: BASE_URL,
    },
  });
}

export async function sendTransactionAcceptedEmail(data: {
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  eventName: string;
  eventDate: Date | string;
  eventVenue: string;
  items: { ticketName: string; quantity: number }[];
  finalPrice: number;
  transactionId: string;
}) {
  await sendMail({
    to: data.customerEmail,
    subject: `Pembayaran Diterima — ${data.eventName} 🎉`,
    templateName: "transaction-accepted",
    context: {
      customerName: data.customerName,
      invoiceNumber: data.invoiceNumber,
      eventName: data.eventName,
      eventDate: formatDate(data.eventDate),
      eventVenue: data.eventVenue,
      items: data.items,
      finalPrice: formatPrice(data.finalPrice),
      transactionId: data.transactionId,
      baseUrl: BASE_URL,
    },
  });
}

export async function sendTransactionRejectedEmail(data: {
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  eventName: string;
  eventDate: Date | string;
  eventVenue: string;
  items: { ticketName: string; quantity: number }[];
  voucherCode?: string;
  pointsUsed?: string;
  couponCode?: string;
  transactionId: string;
}) {
  await sendMail({
    to: data.customerEmail,
    subject: `Pembayaran Ditolak — ${data.invoiceNumber}`,
    templateName: "transaction-rejected",
    context: {
      ...data,
      eventDate: formatDate(data.eventDate),
      baseUrl: BASE_URL,
    },
  });
}

export async function sendResetPasswordEmail(data: {
  email: string;
  name: string;
  resetToken: string;
}) {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${data.resetToken}`;

  await sendMail({
    to: data.email,
    subject: "Reset Password — Eventura",
    templateName: "reset-password",
    context: {
      name: data.name,
      resetUrl,
    },
  });
}
