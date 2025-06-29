const { S3, ListObjectsV2Command, PutObjectCommand } = require("@aws-sdk/client-s3");
const { IncomingForm } = require("formidable"); // fix: destructure IncomingForm
const fs = require("fs");
require("dotenv").config();

exports.config = {
  api: {
    bodyParser: false,
  },
};

const s3 = new S3({
  region: "us-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = "hackthellm-images-bucket";

async function handler(req, res) {
  const allowedOrigins = ['http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    try {
      const {userId} = req.query;

      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `${userId}/`, // only fetch files with that userId prefix
      });
      const data = await s3.send(command);

      const imageUrls = (data.Contents || []).map((item) => (
        `https://${BUCKET_NAME}.s3.us-west-1.amazonaws.com/${item.Key}`
      ));

      return res.status(200).json(imageUrls);
    } catch (error) {
      console.error("S3 list error:", error.message);
      return res.status(500).json({ error: "Failed to list images" });
    }
  }

  if (req.method === "POST") {
    const form = new IncomingForm({ multiples: false }); // fix: set this explicitly

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(400).json({ error: "Error parsing form" });
      }

      console.log("files : ", files);
      console.log("fields : ", fields);
      const file = files.image[0];


      const username = fields.username;

      if (!file || !file.filepath) {
        return res.status(400).json({ error: "pictures : No file uploaded" });
      }

      const stream = fs.createReadStream(file.filepath);
      
      // Sanitize filename to remove spaces and special characters
      const sanitizedFilename = file.originalFilename
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
      
      const key = `${username}/${Date.now()}-${sanitizedFilename}`;

      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: stream,
        ContentType: file.mimetype,
      };

      try {
        await s3.send(new PutObjectCommand(uploadParams));

        return res.status(201).json({
          message: "Image uploaded successfully"
        });
      } catch (error) {
        console.error("Upload error:", error.message);
        return res.status(500).json({ error: "Failed to upload image" });
      }
    }
    );
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}

module.exports = handler;
