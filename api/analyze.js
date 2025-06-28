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
    const predictImageScriptPath = path.join(__dirname, 'scripts', 'predict-image', 'predict_image.py');

    const projectRoot = path.resolve(__dirname, '..');  // adjust '..' if your script is inside a subfolder
    const venvPath = path.join(projectRoot, 'venv');
    const pythonPath = path.join(venvPath, 'Scripts', 'python.exe');

    // 2.3) sharpess, lighting, and predict image scores
    let sharpnessScore, lightingScore, predictedImageScore;

    // 3) send the image to sharpness
    execFile(pythonPath, [sharpnessScriptPath, imageUrl], (error, stdout, stderr) => {
      if (error) {
        console.log("sharpness error : ", error);
        return;
      }
      sharpnessScore = parseFloat(stdout);
    });

    // 4) send the image to lighting
    execFile(pythonPath, [lightingScriptPath, imageUrl], (error, stdout, stderr) => {
      if (error) {
        console.log("lighting script error : ", error);
        return;
      }
      lightingScore = parseFloat(stdout);
    });

    // 5) send the image to predict-image
//     execFile(pythonPath, [predictImageScriptPath, imageUrl], (error, stdout, stderr) => {
//       if (error) {
//         console.log("predict image error : ", error);
//         return;
//       }
//       predictedImageScore = JSON.stringify(stdout);
//     });
//     // 1) parse them out
//     // 2) if highest score is 
// // > 80%	High confidence — prediction is very likely correct; safe to treat as definitive.
// // 50% – 80%	Medium confidence — probably correct but consider showing alternatives or qualifiers like “likely” or “probably.”
// // < 50%	Low confidence — prediction is uncertain; best to show top-N results or disclaim uncertainty.

    execFile(pythonPath, [predictImageScriptPath, imageUrl], (error, stdout, stderr) => {
      if (error) {
        console.error("predict image error : ", error);
        return;
      }

      // Raw output example:
      // "runway: 31.11%\r\nheliport: 12.96%\r\nconstruction_site: 11.87%\r\ndam: 11.21%\r\nindustrial_area: 9.46%\r\n"
      
      // 1) Parse the stdout string into an array of {label, score}
      const lines = stdout.trim().split(/\r?\n/);
      const predictions = lines.map(line => {
        const [label, scoreStr] = line.split(':').map(s => s.trim());
        const score = parseFloat(scoreStr.replace('%', ''));
        return { label, score };
      });

      // 2) Find highest score
      const topPrediction = predictions.reduce((max, cur) => (cur.score > max.score ? cur : max), predictions[0]);

      // 3) Categorize confidence
      const score = topPrediction.score;
      let confidenceCategory;
      if (score > 80) {
        confidenceCategory = 'High confidence';
      } else if (score >= 50) {
        confidenceCategory = 'Medium confidence';
      } else {
        confidenceCategory = 'Low confidence';
      }

      // 4) Output decision info
      console.log(`Top prediction: ${topPrediction.label} (${topPrediction.score}%)`);
      console.log(`Confidence: ${confidenceCategory}`);

      // Optionally handle low confidence, e.g., show top 3 predictions
      if (confidenceCategory === 'Low confidence') {
        console.log('Top 3 predictions (due to low confidence):');
        predictions.slice(0, 3).forEach(p => {
          console.log(`  - ${p.label}: ${p.score}%`);
        });
      }

      // You can now send { lightingScore, sharpnessScore, predictedTopic } to ChatGPT or other downstream logic
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
