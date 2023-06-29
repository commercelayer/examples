require("dotenv").config();
const express = require("express");
const CryptoJS = require("crypto-js");
const hmacSHA256 = require("crypto-js/hmac-sha256");

const app = express();
const port = 9000;

// Fetch RAW incoming JSON requests and put in req.rawBody
app.use(
  express.json({
    limit: "5mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.post("/callback", (req, res) => {
  // Verify the payload coming from Commerce Layer
  const signature = req.headers["x-commercelayer-signature"];
  const hash = hmacSHA256(req.rawBody, process.env.CL_SHARED_SECRET);
  const encode = hash.toString(CryptoJS.enc.Base64);
  if (req.method === "POST" && signature === encode) {
    const payload = req.body;

    // Filter payload and fetch the required order summary
    const lineItemsArray = payload.included.filter(
      (x) => x.type === "line_items" && x.attributes.item_type === "skus"
    );

    const filteredLineItemsArray = lineItemsArray.map((item) => {
      return {
        image_url: item.attributes.image_url,
        name: item.attributes.name,
        quantity: item.attributes.quantity,
        formatted_total_amount: item.attributes.formatted_total_amount,
      };
    });

    // You can use the returned values in filteredLineItemsArray to populate your SendGrid template
    // But you will have to adjust the template to use the {{#each }} helper function
    // Something like so:

    // {{#each lineItems}}
    // <div style="">
    //   <img
    //     src="{{{this.skuImage}}}"
    //     alt="{{{this.skuName}}}"
    //     style="..."
    //   />
    //   <span style="...">{{{this.skuName}}}</span>
    //   <span style="...">x{{{this.skuQuantity}}}</span>
    //   <span style="...">{{{this.skuFormattedAmount}}}</span>
    // </div>
    // {{/each}}

    // But for the sake of this tutorial, we will convert the array to HTML table
    // So we can use the {{{lineItems}}} variable directly in the SendGrid template

    const inputData = {
      customerName: payload.included[2].attributes.first_name,
      customerEmail: payload.data.attributes.customer_email,
      orderNumber: payload.data.attributes.number.toString(),
      orderTimeStamp: payload.data.attributes.placed_at,
      marketName: payload.included[0].attributes.name,
      paymentMethod: payload.included[4].attributes.name,
      shippingAddress: payload.included[2].attributes.full_address,
      shipmentNumber: payload.included.find((x) => x.type === "shipments")
        .attributes.number,
      shippingMethod: payload.included.find(
        (x) => x.type === "shipping_methods"
      ).attributes.name,
      lineItemsHtml:
        `<table class="line-items">` +
        filteredLineItemsArray
          .map(
            (item) =>
              `<tr class="line-item"><td class="line-item-image"><img src="${item.image_url}" alt="${item.name}" /></td><td class="line-item-name">${item.name}</td><td class="line-item-qty">${item.quantity}</td><td class="line-item-amount">${item.formatted_total_amount}</td></tr>`
          )
          .join("") +
        `</table>`,
      totalAmount: payload.data.attributes.formatted_subtotal_amount,
      shippingAmount: payload.data.attributes.formatted_shipping_amount,
      grandTotalAmount: payload.data.attributes.formatted_total_amount,
    };

    // Send Email with SendGrid
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    sgMail
      .send({
        to: inputData.customerEmail,
        from: {
          email: "bolaji@commercelayer.io",
          name: "Cake Store Team",
        },
        reply_to: {
          email: "bolaji@commercelayer.io",
          name: "No Reply",
        },
        templateId: process.env.SENDGRID_TEMPLATE_ID,
        dynamicTemplateData: {
          customerName: inputData.customerName,
          orderTimeStamp: inputData.orderTimeStamp,
          dateFormat: "MMMM DD, YYYY",
          shipmentNumber: inputData.shipmentNumber,
          orderNumber: inputData.orderNumber,
          customerEmail: inputData.customerEmail,
          marketName: inputData.marketName,
          paymentMethod: inputData.paymentMethod,
          shippingAddress: inputData.shippingAddress,
          shippingMethod: inputData.shippingMethod,
          lineItems: inputData.lineItemsHtml,
          totalAmount: inputData.totalAmount,
          shippingAmount: inputData.shippingAmount,
          grandTotalAmount: inputData.grandTotalAmount,
        },
      })
      .then((response) => {
        console.log(response);
        res.status(200).json({
          message: `Email sent to customer (${inputData.customerEmail})!`,
          response: response,
        });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({
          error: error,
        });
      });
  } else {
    res.status(401).json({
      error: "Unauthorized: Invalid signature",
    });
  }
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
