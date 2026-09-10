# nextjs-signature-verification

This example shows a code implementation based on Next.js to verify [callback authenticity](https://docs.commercelayer.io/core/callbacks-security) when receiving a webhook event. The example signs the raw payload with the shared secret (SHA256 HMAC) and compares the result with the `X-CommerceLayer-Signature` callback header, using a constant-time comparison.

The whole verification logic lives in [`pages/api/verify.ts`](./pages/api/verify.ts).

---

## Requirements

- Node.js 22 or later
- [pnpm](https://pnpm.io)
- [ngrok](https://ngrok.com) (to expose your local server to Commerce Layer)

## Quick start guide

1. Install dependencies:

```bash
pnpm install
```

2. Rename the `.env.example` file to `.env.local` and add your valid secret from the webhook, like so:

```text
CL_SHARED_SECRET=your-webhook-secret
```

3. Start the local server in development mode:

```bash
pnpm dev
```

4. Start a ngrok HTTP tunnel listening for HTTP/HTTPS traffic on port 3000:

```bash
ngrok http 3000
```

5. Create a new `orders.place` webhook using the CLI or the Webhooks app inside the Hub:

```bash
cl webhooks:create \
   -n "Order Confirmation Emails" \
   -t "orders.place" \
   -u "https://98ec-104-28-230-121.ngrok.app/api/verify" \
   -i "customer,line_items,shipping_address,billing_address,shipments.shipping_method,payment_method,payment_source,market"
```

6. Place a new order using Commerce Layer [Demo Stores](https://github.com/commercelayer/demo-store), [Hosted Microstore](https://github.com/commercelayer/commercelayer-microstore), or the [CLI Checkout Plugin](https://github.com/commercelayer/commercelayer-cli-plugin-checkout).

```bash
cl plugins:install checkout
```

```bash
commercelayer checkout -O <order-id>
```

or

```bash
cl checkout -S <sku-code-1> -S <sku-code-2> -m <market-id> -e <email-address>
```

## Testing it locally

You don't need a real webhook to try the endpoint out. With the server running, sign a payload yourself and call `/api/verify`:

```bash
BODY='{"data":{"id":"abc123","type":"orders"}}'
SIGNATURE=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "your-webhook-secret" -binary | base64)

curl -i -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -H "X-CommerceLayer-Signature: $SIGNATURE" \
  -d "$BODY"
```

The endpoint answers with:

| Status | Body                                                     | When                                |
| ------ | -------------------------------------------------------- | ----------------------------------- |
| `200`  | `{ "success": true }`                                    | the signature matches the payload   |
| `401`  | `{ "success": false, "error": "Unauthorized" }`          | the signature is missing or invalid |
| `405`  | `{ "success": false, "error": "Method Not Allowed" }`    | the request is not a `POST`         |
| `500`  | `{ "success": false, "error": "Internal Server Error" }` | `CL_SHARED_SECRET` is not set       |

## Available scripts

| Script           | Description                             |
| ---------------- | --------------------------------------- |
| `pnpm dev`       | Starts the development server           |
| `pnpm build`     | Builds the app for production           |
| `pnpm start`     | Serves the production build             |
| `pnpm typecheck` | Runs TypeScript without emitting output |
| `pnpm lint`      | Lints the codebase with ESLint          |
| `pnpm format`    | Formats the codebase with Prettier      |
