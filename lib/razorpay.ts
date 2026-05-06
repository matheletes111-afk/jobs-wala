import Razorpay from "razorpay";
import crypto from "crypto";

let _razorpay: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });
  }
  return _razorpay;
}

export interface CreateOrderParams {
  amount: number; // in paise (smallest currency unit)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  const options = {
    amount: params.amount,
    currency: params.currency || "INR",
    receipt: params.receipt || `receipt_${Date.now()}`,
    notes: params.notes || {},
  };

  return await getRazorpayInstance().orders.create(options);
}

// Plan & Subscription support
export async function createRazorpayPlan(params: {
  name: string;
  description?: string;
  amount: number; // in INR
  currency: string;
  period: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
}) {
  return await getRazorpayInstance().plans.create({
    period: params.period,
    interval: params.interval,
    item: {
      name: params.name,
      amount: params.amount * 100, // convert to smallest unit
      currency: params.currency,
      description: params.description,
    },
  });
}

export async function createRazorpaySubscription(params: {
  planId: string;
  totalCount: number;
  startAt?: number; // Unix timestamp
  notes?: Record<string, string>;
}) {
  return await getRazorpayInstance().subscriptions.create({
    plan_id: params.planId,
    total_count: params.totalCount,
    quantity: 1,
    customer_notify: 1,
    start_at: params.startAt,
    notes: params.notes || {},
  });
}

export async function updateRazorpaySubscription(
  subscriptionId: string,
  newPlanId: string
) {
  const keyId = process.env.RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

  const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}`, {
    method: "PATCH",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: newPlanId,
      schedule_change_at: "cycle_end",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Razorpay Update Failed: ${errorData.error?.description || response.statusText}`);
  }

  return await response.json();
}

export async function cancelRazorpaySubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false) {
  return await getRazorpayInstance().subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
}

export function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const text = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(text)
    .digest("hex");

  return generatedSignature === signature;
}

// Verification for Subscriptions
export function verifyRazorpaySubscription(
  subscriptionId: string,
  paymentId: string,
  signature: string
): boolean {
  const text = `${paymentId}|${subscriptionId}`;
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(text)
    .digest("hex");

  return generatedSignature === signature;
}

export async function getRazorpayOrder(orderId: string) {
  return await getRazorpayInstance().orders.fetch(orderId);
}

export async function getRazorpayPayment(paymentId: string) {
  return await getRazorpayInstance().payments.fetch(paymentId);
}

export async function getRazorpaySubscription(subscriptionId: string) {
  return await getRazorpayInstance().subscriptions.fetch(subscriptionId);
}

