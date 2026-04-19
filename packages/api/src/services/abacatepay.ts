import crypto from "node:crypto";

import { env } from "@rafa-resumos/env/abacatepay";

const ABACATEPAY_API_BASE_URL = "https://api.abacatepay.com/v2";

type AbacatepayApiResponse<T> = {
  data: T;
  error: string | null;
  success: boolean;
};

export type AbacatepayTransparentCharge = {
  amount: number;
  brCode: string;
  brCodeBase64: string;
  createdAt: string;
  devMode: boolean;
  expiresAt: string;
  id: string;
  metadata: Record<string, string>;
  platformFee: number;
  receiptUrl?: string | null;
  status: string;
  updatedAt: string;
};

export type AbacatepayTransparentCheck = {
  expiresAt: string;
  id: string;
  status: string;
};

export type AbacatepayTransparentWebhookPayload = {
  apiVersion: number;
  data: {
    customer?: {
      email?: string;
      id?: string;
      name?: string;
      taxId?: string;
    };
    payerInformation?: unknown;
    reason?: string;
    transparent: {
      amount: number;
      createdAt: string;
      customerId?: string | null;
      devMode?: boolean;
      externalId?: string | null;
      frequency?: string;
      id: string;
      methods?: string[];
      paidAmount?: number | null;
      platformFee?: number | null;
      receiptUrl?: string | null;
      status: string;
      updatedAt: string;
    };
  };
  devMode: boolean;
  event:
    | "transparent.completed"
    | "transparent.disputed"
    | "transparent.refunded"
    | string;
  id: string;
};

async function abacatepayRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${ABACATEPAY_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.ABACATEPAY_API_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const rawText = await response.text();
  const json = rawText
    ? (JSON.parse(rawText) as AbacatepayApiResponse<T>)
    : null;

  if (!response.ok || !json?.success) {
    throw new Error(
      `AbacatePay request failed (${response.status} ${
        response.statusText
      }) for ${path}: ${json?.error ?? rawText ?? "unknown error"}`
    );
  }

  return json.data;
}

export async function createTransparentPixCharge(input: {
  amount: number;
  description?: string;
  expiresIn?: number;
  metadata?: Record<string, string>;
}) {
  return abacatepayRequest<AbacatepayTransparentCharge>(
    "/transparents/create",
    {
      method: "POST",
      body: JSON.stringify({
        method: "PIX",
        data: {
          amount: input.amount,
          ...(input.description ? { description: input.description } : {}),
          ...(input.expiresIn ? { expiresIn: input.expiresIn } : {}),
          ...(input.metadata ? { metadata: input.metadata } : {}),
        },
      }),
    }
  );
}

export async function checkTransparentPixCharge(id: string) {
  return abacatepayRequest<AbacatepayTransparentCheck>(
    `/transparents/check?id=${encodeURIComponent(id)}`
  );
}

export async function simulateTransparentPixCharge(
  id: string,
  metadata?: Record<string, string>
) {
  return abacatepayRequest<AbacatepayTransparentCharge>(
    `/transparents/simulate-payment?id=${encodeURIComponent(id)}`,
    {
      method: "POST",
      body: JSON.stringify({
        id,
        ...(metadata ? { metadata } : {}),
      }),
    }
  );
}

export function verifyAbacatepayWebhookSignature(
  rawBody: string,
  signatureFromHeader: string
) {
  if (!signatureFromHeader) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.ABACATEPAY_WEBHOOK_PUBLIC_KEY)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("base64");

  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(signatureFromHeader);

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}
