# nextjs-signature-verification

This example shows a code implementation based on Next.js to verify [callback authenticity](https://docs.commercelayer.io/core/callbacks-security) when receiving a webhook event. The example is going to sign the payload with the shared secret (SHA256 HMAC) and compare the result with the X-CommerceLayer-Signature callback header.

---

## Quick start guide

1. Install dependencies

```bash
pnpm install
```

2. Start the local server:

```bash
pnpm dev
```

3. Start a ngrok HTTP tunnel listening for HTTP/HTTPS traffic on port 3000:

```bash
ngrok http 3000
```

4. Create a new `orders.place` webhook using the CLI or the Webhooks app inside the Hub:

```bash
cl webhooks:create \
   -n "Order Confirmation Emails" \
   -t "orders.place" \
   -u "https://98ec-104-28-230-121.ngrok.app/api/verify" \
   -i "customer,line_items,shipping_address,billing_address,shipments.shipping_method,payment_method,payment_source,market"
```

5. Rename the .env.example file to .env.local and add your valid secret from the webhook, like so:

```text
CL_SHARED_SECRET="your-webhook-secret"
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

