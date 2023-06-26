# dropin-basic-store-demo

This example shows a code implementation for transforming a plain HTML page into an enterprise-grade static commerce website, with product listing, prices, cart, checkout, customer identity, and customer portal. To get started, kindly read [this comprehensive tutorial](https://commercelayer.io/blog/composable-commerce-with-micro-frontends) on our blog and this [interactive documentation](https://commercelayer.github.io/drop-in.js).

![](https://user-images.githubusercontent.com/1681269/203999041-980f0dec-4fca-45c9-a558-b14153158106.jpg)

![](https://www.datocms-assets.com/35053/1687788535-screenshot-2023-06-26-at-15-08-50.png)

---

## Quick start guide

1. Update the configuration script tag and add your valid credentials, like so:

```js
<script>
  (function() {
    window.commercelayerConfig = {
      clientId: 'your_client_id',
      slug: 'your_organization_slug',
      scope: 'your_market_scope',
      debug: 'all', // default is 'none'
      orderReturnUrl: 'https://example.com' // optional
    }
  }());
</script>
```

2. Open the `index.html` file in a web browser.
