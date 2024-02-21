import type { NextApiRequest, NextApiResponse } from "next";
import { createHmac } from "node:crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

type Data = {
  success: boolean;
  error?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  return new Promise<void>((resolve) => {
    const signature = req.headers["x-commercelayer-signature"];
    let buffer = "";
    req.on("data", (chunk) => {
      buffer += chunk;
    });

    req.on("end", () => {
      const encode = createHmac(
        "sha256",
        process.env.CL_SHARED_SECRET as string
      )
        .update(Buffer.from(buffer).toString())
        .digest("base64");

      if (req.method === "POST" && signature === encode) {
        console.log("OK");
        res.status(200).json({
          success: true,
        });
      } else {
        console.log("KO");
        res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }
      resolve();
    });
  });
}
