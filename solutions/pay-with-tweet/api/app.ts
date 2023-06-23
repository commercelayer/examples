require("dotenv").config();
import express, { Request, Response } from "express";
import getTweets from "./getTweets";

const CryptoJS = require("crypto-js");
const hmacSHA256 = require("crypto-js/hmac-sha256");
const app = require("express")();
const port = process.env.PORT || 9000;

interface tweetUsers {
  id: string | undefined;
  username: string | undefined;
  name: string | undefined;
  email: string;
  tweet: string;
  created_at: string | undefined;
}

// Use the JSON middleware and verify handler to attach a rawBody attribute to the req object.
app.use(
  express.json({
    limit: "5mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    }
  })
);

app.post("/authorize", (req: Request, res: Response) => {
  // Verify the payload coming from Commerce Layer.
  const signature = req.headers["x-commercelayer-signature"];
  const hash = hmacSHA256(req.rawBody, process.env.CL_SHARED_SECRET);
  const encode = hash.toString(CryptoJS.enc.Base64);

  if (req.method === "POST" && signature === encode) {
    const payload = JSON.parse(req.rawBody);

    // Get the included orders data from the payload.
    payload.included.slice(0, 1).map((order: any) => {
      const startTime = order.attributes.updated_at;
      const endTime = new Date(
        new Date(startTime).getTime() + 1800000
      ).toISOString();
      const orderNumber = order.attributes.number;
      const customerEmail = order.attributes.customer_email;
      const amountCents = order.attributes.subtotal_taxable_amount_cents;
      const transactionToken = order.attributes.token;

      // Fetch tweets created between startTime and endTime.
      getTweets(startTime, endTime).then((data) => {
        // If tweet(s) found, process the transaction.
        if (data.tweets.length !== 0) {
          const tweets = data.tweets;
          const users = data.users;
          let customerData: tweetUsers;

          tweets.map((tweet) => {
            // Find the tweet created by the customer.
            if (tweet.text.includes(orderNumber)) {
              customerData = {
                id: tweet.author_id,
                username: users.find((u) => u.id === tweet.author_id)?.username,
                name: users.find((u) => u.id === tweet.author_id)?.name,
                email: customerEmail,
                tweet: tweet.text,
                created_at: tweet.created_at
              };
              // If successful, authorize the transaction.
              res.status(200).json({
                success: true,
                data: {
                  transaction_token: transactionToken,
                  amount_cents: amountCents,
                  metadata: {
                    ...customerData
                  }
                }
              });
            } else {
              // If unsuccessful, return an error, and fail the transaction.
              res.status(422).json({
                success: false,
                data: {
                  transaction_token: transactionToken,
                  amount_cents: amountCents,
                  error: {
                    code: "404",
                    message: `Order number: ${orderNumber} not found in tweets`
                  }
                }
              });
            }
          });
        } else {
          // If tweet(s) not found, return an error, and fail the transaction.
          res.status(422).json({
            success: false,
            data: {
              transaction_token: transactionToken,
              amount_cents: amountCents,
              error: {
                code: "404",
                message: `Tweet with order number: ${orderNumber} not found.`
              }
            }
          });
        }
      });
    });
  } else {
    // If signature does not match the shared secret, return an error.
    res.status(401).json({
      error: "Unauthorized: Invalid signature"
    });
  }
});

module.exports = app;

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
