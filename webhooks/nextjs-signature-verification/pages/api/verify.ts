import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";

// The signature is computed over the exact bytes Commerce Layer sent, so the body
// must stay untouched. Any parsing (even a JSON round-trip) would break the HMAC.
export const config = {
  api: {
    bodyParser: false
  }
};

const SIGNATURE_HEADER = "x-commercelayer-signature";

type Data = {
  success: boolean;
  error?: string;
};

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

function isValidSignature(rawBody: Buffer, signature: string, sharedSecret: string): boolean {
  const expected = createHmac("sha256", sharedSecret).update(rawBody).digest("base64");
  const received = Buffer.from(signature);
  const digest = Buffer.from(expected);

  // `timingSafeEqual` throws on length mismatch, so compare the lengths first.
  return received.length === digest.length && timingSafeEqual(received, digest);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const sharedSecret = process.env.CL_SHARED_SECRET;

  if (!sharedSecret) {
    console.error("Missing CL_SHARED_SECRET environment variable");
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }

  const signature = req.headers[SIGNATURE_HEADER];

  if (typeof signature !== "string") {
    console.warn(`Missing ${SIGNATURE_HEADER} header`);
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const rawBody = await readRawBody(req);

  if (!isValidSignature(rawBody, signature, sharedSecret)) {
    console.warn("Invalid callback signature");
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // The callback is authentic: this is where you would handle the webhook payload.
  console.warn("Valid callback signature");

  return res.status(200).json({ success: true });
}
