# twilio-sms-notification

This example shows a minimal implementation for sending an SMS notification to customers when an SKU that had finished is back in stock using Commerce Layer Webhooks and Twilio SMS API. To get started, kindly read the [comprehensive tutorial](https://commercelayer.io/blog/a-comprehensive-guide-to-commerce-layer-webhooks) on our blog to see how it all works.

![](https://www.datocms-assets.com/35053/1654620944-twilio-response-sms.png)

---

## Quick start guide

Rename the `.env.example` file to `.env.local` and add your valid credentials, like so:

```bash
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
CL_SHARED_SECRET=""
```

Start the local server:

```bash
node server.js
```

Start a ngrok HTTP tunnel listening for HTTP/HTTPS traffic on port 9000:

```bash
ngrok http 9000
```

Create a new `in_stock_subscriptions.notify` webhook using Commerce Layer CLI:

```bash
cl webhooks:create \
   -n "Back In Stock Notifications" \
   -t "in_stock_subscriptions.notify" \
   -u "https://39cb-8-21-8-251.eu.ngrok.io/callback" \
   -i "sku"
```

Create a new stock subscription associated with some custom metadata (telephone number and customer name) and required relationships (market ID, customer’s ID, and SKU ID).

```bash
cl resources:create in_stock_subscriptions -m \
   customer_telephone="+12345678910" \
   customer_name="Bolaji Ayodeji" -r \
   market="VgKNLhKGBj" \
   customer="OwyehaRvJX" \
   sku="ZrxeSKVNRB
```
