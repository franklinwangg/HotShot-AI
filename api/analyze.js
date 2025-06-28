const { S3, PutObjectCommand } = require("@aws-sdk/client-s3");
const { IncomingForm } = require("formidable");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require('path');

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

  else if (req.method === "POST") {
    // 1) get image url
    const { imageUrl } = req.body;

    // 2.2) script path
    const sharpnessScriptPath = path.join(__dirname, 'scripts', 'sharpness', 'sharpness_score.py');
    const lightingScriptPath = path.join(__dirname, 'scripts', 'lighting', 'lighting_score.py');

    const projectRoot = path.resolve(__dirname, '..');  // adjust '..' if your script is inside a subfolder
    const venvPath = path.join(projectRoot, 'venv');
    const pythonPath = path.join(venvPath, 'Scripts', 'python.exe');

    // 3) send the image to sharpness
    execFile(pythonPath, [sharpnessScriptPath, imageUrl], (error, stdout, stderr) => {
      if (error) {
        console.log("sharpness error : ", error);
        return;
      }
      console.log("sharpness stdout raw:", JSON.stringify(stdout));
      const score = parseFloat(stdout);
      console.log("sharpness parsed score:", score);
    });

    // 4) send the image to lighting
    execFile(pythonPath, [lightingScriptPath, imageUrl], (error, stdout, stderr) => {
      if (error) {
        console.log("lighting script error : ", error);
        return;
      }
      console.log("lighting script stdout raw:", JSON.stringify(stdout));
      const score = parseFloat(stdout);
      console.log("lighting script parsed score:", score);
    });

  }
};

// Login handler
async function handleLogin(req, res) {
  console.log("inside handleLogin now");

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING_2,
  });

  try {
    await client.connect();

    const result = await client.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, result.rows[0].password_hash);
    if (isMatch) {
      res.status(200).json({ success: true, message: "Login successful" });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  } finally {
    await client.end();
  }
}

module.exports = handler;
