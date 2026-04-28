import crypto from "node:crypto";
import { env } from "@rafa-resumos/env/abacatepay";
const ABACATEPAY_API_BASE_URL = "https://api.abacatepay.com/v2";
async function abacatepayRequest(path, init) {
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
        ? JSON.parse(rawText)
        : null;
    if (!response.ok || !json?.success) {
        throw new Error(`AbacatePay request failed (${response.status} ${response.statusText}) for ${path}: ${json?.error ?? rawText ?? "unknown error"}`);
    }
    return json.data;
}
export async function createTransparentPixCharge(input) {
    return abacatepayRequest("/transparents/create", {
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
    });
}
export async function checkTransparentPixCharge(id) {
    return abacatepayRequest(`/transparents/check?id=${encodeURIComponent(id)}`);
}
export async function simulateTransparentPixCharge(id, metadata) {
    return abacatepayRequest(`/transparents/simulate-payment?id=${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify({
            id,
            ...(metadata ? { metadata } : {}),
        }),
    });
}
export function verifyAbacatepayWebhookSignature(rawBody, signatureFromHeader) {
    if (!signatureFromHeader) {
        return false;
    }
    const expectedSignature = crypto
        .createHmac("sha256", env.ABACATEPAY_WEBHOOK_PUBLIC_KEY)
        .update(Buffer.from(rawBody, "utf8"))
        .digest("base64");
    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(signatureFromHeader);
    return (expected.length === received.length &&
        crypto.timingSafeEqual(expected, received));
}
