# dropin-basic-store-demo

This example shows a code implementation for transforming a plain HTML page into an enterprise-grade static commerce website, with product listing, prices, cart, checkout, customer identity, and customer portal. To get started, kindly read [this comprehensive tutorial](https://commercelayer.io/blog/composable-commerce-with-micro-frontends) on our blog and this [interactive documentation](https://commercelayer.github.io/drop-in.js).

![](https://user-images.githubusercontent.com/1681269/203999041-980f0dec-4fca-45c9-a558-b14153158106.jpg)

![](https://www.datocms-assets.com/35053/1687788535-screenshot-2023-06-26-at-15-08-50.png)

---

## Quick start guide

1. Update the configuration script tag and add your valid credentials, like so:

```html
<script>
  (function() {
    window.commercelayerConfig = {
      clientId: 'your_client_id',
      scope: 'your_market_scope',
      debug: 'all', // default is 'none'
      defaultAttributes: {
        orders: {
          /**
           * The preferred language code (ISO 639-1) to be used when communicating with the customer.
           * If the language is supported, the hosted checkout will be localized accordingly.
           * @default 'en'
           */
          language_code: 'en',
          /**
           * The URL the cart's *Continue shopping* button points to. This is also used in the thank you page.
           * @optional
           */
          return_url: 'https://example.com'
        }
      }
    }
  }());
</script>
```

2. Run the `index.html` file with an HTTP server using `npx serve` or [VSCode Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).

> [!NOTE]
> Opening the `index.html` file directly in Chrome browser will not work since cookies are disabled when the protocol is `file://` for security reasons. Always ensure to run the file with an HTTP server.
