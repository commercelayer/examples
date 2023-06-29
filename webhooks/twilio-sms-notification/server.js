require("dotenv").config();
const express = require("express");
const CryptoJS = require("crypto-js");
const hmacSHA256 = require("crypto-js/hmac-sha256");

const app = express();
const port = 9000;

// Define Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

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
  const hash = hmacSHA256(
    req.rawBody,
    process.env.CL_SHARED_SECRET
  );
  const encode = hash.toString(CryptoJS.enc.Base64);
  if (req.method === "POST" && signature === encode) {
    const payload = req.body;

    // Fetch the customer's name and telephone number from the custom metadata
    const customerName = payload.data.attributes.metadata.customer_name;
    const customerTelephone =
      payload.data.attributes.metadata.customer_telephone;

    // Fetch the SKU name from the included sku relationship
    const skuName = payload.included.map((item) => item.attributes.name);

    // Fetch the SKU code from the payload's default attributes
    const skuCode = payload.data.attributes.sku_code;

    // Send SMS with Twilio
    client.messages
      .create({
        body: `Hi ${customerName}!\n\nThe ${skuName} (${skuCode}) is now back in stock 🎉. You can place your order right away here: https://commercelayer.io/developers. Cheers!`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+${customerTelephone}`,
      })
      .then((message) => console.log("Message sent!", message))
      .catch((err) => console.error("Error sending message", err));
    res.status(200).json({
      message: "Message sent to customer!",
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
