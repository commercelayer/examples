# Commerce Layer — External Gateway Demo (Mollie)

A minimal TypeScript monorepo that demonstrates Commerce Layer's **asynchronous external payment gateway** flow using [Mollie](https://mollie.com) in test mode. To get started, kindly read [this comprehensive article](https://commercelayer.io/blog/connecting-any-payment-gateway-to-commerce-layer-with-external-payments) on our blog.

```
User fills checkout → SPA creates Mollie payment → _place order
  → CL calls /authorize → gateway stores Mollie payment ID, returns 202 (async)
  → SPA redirects to Mollie hosted checkout
  → User completes payment on Mollie
  → Mollie fires webhook → gateway calls CL webhook → payment AUTHORIZED
  → SPA polls and shows live transition
```

## Packages

| Package | Description |
|---|---|
| `packages/app` | Vite + React SPA — builds the order and shows the async status |
| `packages/mollie-gateway` | Hono HTTP server — Mollie gateway bridge (authorize + webhook) |

---

## Prerequisites

- Node.js 20+
- pnpm 10+
- A Commerce Layer account with:
  - A **Sales Channel** application (for the frontend)
  - An **Integration** application (for the gateway server)
  - A configured **Market** with a SKU, inventory, and at least one shipping method
- A [Mollie](https://mollie.com) account with a **test API key**

---

## 1. Commerce Layer Dashboard Setup

### 1a. Create the External Payment Gateway

1. Go to **Settings → Payment gateways → Add payment gateway → External**
2. Fill in:
   - **Name**: `Mollie Gateway (Demo)`
   - **Authorize URL**: `https://abc123.ngrok.io/authorize`
   - **Capture URL**: _(leave empty for this demo)_
   - **Void URL**: _(leave empty)_
   - **Refund URL**: _(leave empty)_
3. Save. You will get:
   - A **Shared secret** — copy it for `CL_GATEWAY_SHARED_SECRET`
   - A **Webhook endpoint URL** — copy it for `CL_WEBHOOK_ENDPOINT_URL`

> ⚠️ The `authorize_url` must be reachable by Commerce Layer's servers. For local development, use a tunnel like [ngrok](https://ngrok.com) or [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/):
> ```bash
> ngrok http 3001
> # or
> cloudflared tunnel --url http://localhost:3001
> ```
> Then update the gateway's authorize URL to the tunnel URL (e.g. `https://abc123.ngrok.io/authorize`).
> Also set `GATEWAY_PUBLIC_URL` in the gateway `.env` to the same tunnel URL so Mollie can reach the webhook.

### 1b. Attach the gateway to your Market

1. Go to **Markets → your market → Payment methods**
2. Add a new payment method and select **External** as the gateway

> To use the `_authorize` flow (second button), enable **Auto place** on the payment method in the CL dashboard.

### 1c. Create application credentials

- **Sales Channel app**: used by the frontend. Scope it to your market.
- **Integration app**: used by the gateway server.

---

## 2. Configure environment variables

```bash
# Gateway server
cp packages/mollie-gateway/.env.example packages/mollie-gateway/.env

# SPA
cp packages/app/.env.example packages/app/.env
```

Edit both `.env` files with your values.

**`packages/mollie-gateway/.env`**
```env
CL_CLIENT_ID=<integration-client-id>
CL_CLIENT_SECRET=<integration-client-secret>
CL_GATEWAY_SHARED_SECRET=<shared-secret-from-dashboard>
CL_WEBHOOK_ENDPOINT_URL=<webhook-endpoint-url-from-dashboard>
MOLLIE_API_KEY=test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GATEWAY_PUBLIC_URL=https://<your-tunnel>.ngrok.io
APP_RETURN_URL=http://localhost:5173/return
PORT=3001
```

**`packages/app/.env`**
```env
VITE_CL_CLIENT_ID=<sales-channel-client-id>
VITE_CL_MARKET_SCOPE=market:id:<your-market-id>
VITE_CL_SKU_CODE=<a-valid-sku-code-in-your-org>
VITE_GATEWAY_URL=http://localhost:3001
```

---

## 3. Install dependencies

```bash
pnpm install
```

---

## 4. Run

```bash
pnpm dev
```

This starts both packages in parallel:
- **SPA** → `http://localhost:5173`
- **Mollie gateway** → `http://localhost:3001`

Open `http://localhost:5173` and choose a checkout flow.

---

## How the async flow works

```
┌─────────────────┐        ┌───────────────────┐        ┌─────────────────────-─┐
│   SPA (5173)    │        │  Mollie GW (3001) │        │  Commerce Layer API   │
└────────┬────────┘        └────────┬──────────┘        └────-──────┬───────────┘
         │                          │                               │
         │ Build order via CL SDK   │                               │
         │─────────────────────────────────────────────────────────▶│
         │                          │                               │
         │ POST /initiate-payment   │                               │
         │─────────────────────────▶│                               │
         │                          │ Create Mollie payment         │
         │                          │──────────────────────────────▶ Mollie API
         │◀── { paymentId, url } ───│                               │
         │                          │                               │
         │ _place (or _authorize)   │                               │
         │─────────────────────────────────────────────────────────▶│
         │                          │                               │
         │                          │◀──── POST /authorize ─────────│
         │                          │  (payment_source_token        │
         │                          │   = Mollie paymentId)         │
         │                          │                               │
         │                          │ HTTP 202 + action_id ────────▶│
         │                          │                               │
         │ Redirect to Mollie URL   │                               │
         │                          │                               │
         │◀─── Mollie webhook ──────│◀── POST /mollie-webhook ───── Mollie
         │                          │                               │
         │                          │ POST webhook_endpoint_url ───▶│
         │                          │   { action_id, success: true }│
         │                          │              payment_status = authorized
         │ Poll detects authorized  │                               │
         │─────────────────────────────────────────────────────────▶│
         │ ✅ Show "authorized"     │                               │
```

---

## Project structure

```
external-payment-gateway/
├── packages/
│   ├── app/                              # Vite + React SPA
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── CheckoutPage.tsx      # Builds order, initiates Mollie payment, places order
│   │       │   └── ReturnPage.tsx        # Polls CL, shows async status transition
│   │       └── lib/cl.ts                 # CL SDK client (sales channel token)
│   └── mock-gateway/                     # Hono HTTP server — Mollie gateway bridge
│       └── src/
│           ├── index.ts                  # Server entry point
│           ├── routes/
│           │   ├── authorize.ts          # POST /authorize (CL callback → 202 async)
│           │   ├── initiate-payment.ts   # POST /initiate-payment (create Mollie payment)
│           │   └── mollie-webhook.ts     # POST /mollie-webhook (Mollie → CL webhook)
│           └── lib/
│               ├── cl.ts                 # CL SDK client (integration token)
│               └── signature.ts          # HMAC signature verification
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```
