# sendgrid-zapier-emails

This example shows a code implementation and email templates for sending order confirmation (or any type of) emails to customers using Commerce Layer Webhooks, SendGrid API, Zapier Code Runner, and Nodejs. To get started, kindly read [this comprehensive tutorial](https://commercelayer.io/blog/how-to-send-templated-emails-with-commerce-layer-and-sendgrid) on our blog.

![](https://www.datocms-assets.com/35053/1665661860-order-email-full-demo.png)

---

## Quick start guide

1. Rename the .env.example file to .env.local and add your valid credentials, like so:

```text
SENDGRID_API_KEY=""
SENDGRID_TEMPLATE_ID=""
CL_SHARED_SECRET=""
```

2. Start the local server:

```bash
node server.js
```

3. Start a ngrok HTTP tunnel listening for HTTP/HTTPS traffic on port 9000:

```bash
ngrok http 9000
```

4. Create a new `orders.place` webhook using the CLI:

```bash
cl webhooks:create \
   -n "Order Confirmation Emails" \
   -t "orders.place" \
   -u "https://98ec-104-28-230-121.eu.ngrok.io/callback" \
   -i "customer,line_items,shipping_address,billing_address,shipments.shipping_method,payment_method,payment_source,market"
```

5. Place a new order using Commerce Layer [Demo Stores](https://github.com/commercelayer/demo-store), [Hosted Microstore](https://github.com/commercelayer/commercelayer-microstore), or the [CLI Checkout Plugin](https://github.com/commercelayer/commercelayer-cli-plugin-checkout).

```bash
cl plugins:install checkout
```

```bash
commercelayer checkout -O <order-id>

or

cl checkout -S <sku-code-1> -S <sku-code-2> -m <market-id> -e <email-address>
```
