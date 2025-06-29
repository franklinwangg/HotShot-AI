const { S3, PutObjectCommand } = require("@aws-sdk/client-s3");
const { IncomingForm } = require("formidable");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require('path');
const OpenAI = require("openai");


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
    const pythonPath = path.join(venvPath, process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python3');

    // 2.3) sharpess, lighting, and predict image scores
    let sharpnessScore, lightingScore, predictedImage, imageConfidenceCategory;

    try {
      // Properly encode the URL to handle spaces and special characters
      const encodedImageUrl = encodeURI(imageUrl);
      
      const [sharpnessOut, lightingOut, predictOut] = await Promise.all([
        execPythonScript(pythonPath, sharpnessScriptPath, encodedImageUrl),
        execPythonScript(pythonPath, lightingScriptPath, encodedImageUrl),
        execPythonScript(pythonPath, predictImageScriptPath, encodedImageUrl)
      ]);

      sharpnessScore = parseFloat(sharpnessOut);
      lightingScore = parseFloat(lightingOut);

      // parse prediction output as before
      const lines = predictOut.trim().split(/\r?\n/);
      const predictions = lines.map(line => {
        const [label, scoreStr] = line.split(':').map(s => s.trim());
        const score = parseFloat(scoreStr.replace('%', ''));
        return { label, score };
      });

      const topPrediction = predictions.reduce((max, cur) => (cur.score > max.score ? cur : max), predictions[0]);
      const score = topPrediction.score;
      predictedImage = topPrediction.label;

      if (score > 80) imageConfidenceCategory = 'High confidence';
      else if (score >= 50) imageConfidenceCategory = 'Medium confidence';
      else imageConfidenceCategory = 'Low confidence';

      console.log("imageConfidenceCategory:", imageConfidenceCategory);

    } catch (err) {
      console.error("Error running Python scripts:", err);
      return res.status(500).json({ error: "Failed to analyze image" });
    }

    // Calculate overall score (50% sharpness + 50% lighting)
    const overallScore = (sharpnessScore + lightingScore) / 2;
    
    // Generate concise feedback based on scores
    let feedback = "";
    
    if (sharpnessScore >= 70 && lightingScore >= 70) {
      feedback = "Excellent photo! Great sharpness and lighting.";
    } else if (sharpnessScore >= 50 && lightingScore >= 50) {
      feedback = "Good photo with decent sharpness and lighting.";
    } else {
      feedback = "Photo needs improvement: ";
      if (sharpnessScore < 50) {
        feedback += "Increase sharpness by using a tripod or faster shutter speed. ";
      }
      if (lightingScore < 50) {
        feedback += "Improve lighting by finding better light sources or adjusting exposure. ";
      }
    }

    // Return the analysis results
    res.status(200).json({
      score: Math.round(overallScore), // Already out of 100
      feedback: feedback,
      sharpnessScore: Math.round(sharpnessScore),
      lightingScore: Math.round(lightingScore),
      predictedImage: predictedImage,
      confidence: imageConfidenceCategory
    });

  }
};

const execPythonScript = (pythonPath, scriptPath, imageUrl) => {
  return new Promise((resolve, reject) => {
    execFile(pythonPath, [scriptPath, imageUrl], (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve(stdout);
    });
  });
};


module.exports = handler;
