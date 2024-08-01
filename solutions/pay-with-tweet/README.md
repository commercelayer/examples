# pay-with-tweet

This example shows a code implementation of a demo pay-with-tweet external payment gateway. This demo is built with Commerce Layer external gateways API and Twitter API. The idea is that when a customer purchases from your store, they’re prompted to make a tweet with a predefined text that includes their order number. The external payment gateway then reads the Twitter API for the tweet and authorizes the order if the tweet is found—good for peer-to-peer publicity/marketing in spaces like conferences. To get started, kindly read [this comprehensive tutorial](https://commercelayer.io/blog/building-an-external-payment-gateway-with-twitter-api) on our blog.

![](https://www.datocms-assets.com/35053/1660410417-pay-with-tweet.svg)

![](https://www.datocms-assets.com/35053/1660312466-pay-with-tweet-success.png?q=80&auto=format&dpr=2&w=800&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&fp-z=1)

---

## Quick start guide

1. Rename the `.env.example` file to `.env` and add your valid credentials, like so:

```bash
CL_SHARED_SECRET=""
CL_TWITTER_ID=""
TW_BEARER_TOKEN=""
```

2. Start the local server in development mode:

```bash
pnpm dev
```

3. Start a ngrok HTTP tunnel listening for HTTP/HTTPS traffic on port 9000:

```bash
ngrok http 9000
```

4. Create a new payment gateway using the [CLI](https://github.com/commercelayer/commercelayer-cli):

```bash
cl create external_gateways -a \
    name="Pay With Tweet"
```

5. Create a payment method:

```bash
cl create payment_methods -a \
    payment_source_type="ExternalPayment" \
    currency_code="USD" \
    price_amount_cents=0 -r \
    market="FlqxGhKrFg" \
    payment_gateway="BkXMMsBDGa"
```

6. Create an external payment:

```bash
cl create external_payments -a \
    payment_source_token="testTokeN1234"
```

7. Create and place an order:

```bash
cl update orders GHrQkxDVPS -a _place=true
```
