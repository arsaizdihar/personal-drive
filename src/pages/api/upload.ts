import formidable from "formidable";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import { isPathValid } from "~/server/file/isPathValid";
import { s3 } from "~/server/s3";
import { getRequestApp } from "~/utils/server/getRequestApp";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).end("Method not allowed");
    return;
  }
  const form = new formidable.IncomingForm({
    maxFileSize: 100 * 1024 * 1024,
    multiples: false,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json(err);
    }
    const file = files.file as formidable.File | undefined;
    const path = fields.path;

    if (!file) {
      return res.status(400).end("No file");
    }
    if (typeof path !== "string") {
      return res.status(400).end("Invalid paths");
    }

    const app = await getRequestApp(req, fields.appName);
    if (!app) {
      return res.status(403).end("Invalid app");
    }
    const isValid = await isPathValid(path, app.id);
    if (!isValid) {
      return res.status(400).end("Invalid paths");
    }
    const fileStream = fs.createReadStream(file.filepath);
    const result = await s3
      .upload({
        Bucket: process.env.S3_BUCKET!,
        Key: `${app.name}/${path}${file.originalFilename}`,
        Body: fileStream,
        ACL: "public-read",
        ContentType: file.mimetype || undefined,
      })
      .promise();

    res.json(result);
  });
}
