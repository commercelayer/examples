import express from "express";
import { createHmac } from "node:crypto";

const app = express();

const port = 3000;

const CL_SHARED_SECRET = "<your-webhook-secret>";

app.use(
  express.json({
    limit: "5mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.post("/api/verify", (req, res) => {
  const signature = req.headers["x-commercelayer-signature"];

  const encode = createHmac("sha256", CL_SHARED_SECRET)
    .update(req.rawBody)
    .digest("base64");

  if (signature === encode) {
    console.log("OK");
    res.status(200).json({
      success: true,
      data: {},
    });
  } else {
    console.log("KO");
    res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
