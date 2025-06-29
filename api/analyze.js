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
    let sharpnessScore, lightingScore, predictedImage, imageConfidenceCategory, queryString = "";

    try {
      const [sharpnessOut, lightingOut, predictOut] = await Promise.all([
        execPythonScript(pythonPath, sharpnessScriptPath, imageUrl),
        execPythonScript(pythonPath, lightingScriptPath, imageUrl),
        execPythonScript(pythonPath, predictImageScriptPath, imageUrl)
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

      // now safely use imageConfidenceCategory, predictedImage, sharpnessScore, etc.
      console.log("imageConfidenceCategory:", imageConfidenceCategory);
      // (rest of your query building and OpenAI code here...)

    } catch (err) {
      console.error("Error running Python scripts:", err);
      return res.status(500).json({ error: "Failed to analyze image" });
    }


    console.log("imageConfidenceCategory : ", imageConfidenceCategory);

    if (imageConfidenceCategory === 'High confidence') {
      queryString += `I have an image of a ${predictedImage}.`
      sharpnessNeedsImprovement = false;
      lightingNeedsImprovement = false;

      if (sharpnessScore < 0.5 || lightingScore < 0.5) {
        if (sharpnessScore < 0.5) {
          sharpnessNeedsImprovement = true;
          queryString += `The sharpness score is quite low at ${sharpnessScore} on BRISQUE.`
        }
        if (lightingScore < 0.5) {
          lightingNeedsImprovement = true;
          queryString = `The lighting score is quite low (${lightingScore}) on OpenCV. `;
        }
        queryString += `What are some tips for improving the `;

        if (sharpnessNeedsImprovement && !lightingNeedsImprovement) {
          queryString += `sharpness of a ${predictedImage}?`;
        }
        if (!sharpnessNeedsImprovement && lightingNeedsImprovement) {
          queryString += `lighting of a ${predictedImage}?`;
        }
        if (sharpnessNeedsImprovement && lightingNeedsImprovement) {
          queryString += `sharpness and lighting of a photo of a ${predictedImage}?`;
        }
      }
      if (sharpnessScore >= 0.5 && lightingScore >= 0.5) {
        queryString += `Both the sharpness and lighting on the ${predictedImage} are good. Give this picture a short compliment!`;
      }
    }
    if (imageConfidenceCategory === 'Medium confidence') {
      queryString += `This might be an image of a ${predictedImage}, but I'm not fully confident so use softer language in your response.`
      sharpnessNeedsImprovement = false;
      lightingNeedsImprovement = false;

      if (sharpnessScore < 0.5 || lightingScore < 0.5) {
        if (sharpnessScore < 0.5) {
          sharpnessNeedsImprovement = true;
          queryString += `The sharpness score is quite low at ${sharpnessScore} on BRISQUE.`
        }
        if (lightingScore < 0.5) {
          lightingNeedsImprovement = true;
          queryString = `The lighting score is quite low (${lightingScore}) on OpenCV. `;
        }
        queryString += `What are some tips for improving the `;

        if (sharpnessNeedsImprovement && !lightingNeedsImprovement) {
          queryString += `sharpness of a ${predictedImage}?`;
        }
        if (!sharpnessNeedsImprovement && lightingNeedsImprovement) {
          queryString += `lighting of a ${predictedImage}?`;
        }
        if (sharpnessNeedsImprovement && lightingNeedsImprovement) {
          queryString += `sharpness and lighting of a photo of a ${predictedImage}?`;
        }
      }
      if (sharpnessScore >= 0.5 && lightingScore >= 0.5) {
        queryString += `Both the sharpness and lighting on the ${predictedImage} are good. Give this picture a short compliment!`;
      }
    }
    else {
      sharpnessNeedsImprovement = false;
      lightingNeedsImprovement = false;

      if (sharpnessScore < 0.5 || lightingScore < 0.5) {
        if (sharpnessScore < 0.5) {
          sharpnessNeedsImprovement = true;
          queryString += `The sharpness score is quite low at ${sharpnessScore} on BRISQUE.`
        }
        if (lightingScore < 0.5) {
          lightingNeedsImprovement = true;
          queryString = `The lighting score is quite low (${lightingScore}) on OpenCV. `;
        }
        queryString += `What are some general tips for improving the `;

        if (sharpnessNeedsImprovement && !lightingNeedsImprovement) {
          queryString += `sharpness of a picture?`;
        }
        if (!sharpnessNeedsImprovement && lightingNeedsImprovement) {
          queryString += `lighting of a picture?`;
        }
        if (sharpnessNeedsImprovement && lightingNeedsImprovement) {
          queryString += `sharpness and lighting of a picture?`;
        }
      }
      if (sharpnessScore >= 0.5 && lightingScore >= 0.5) {
        queryString += `Both the sharpness and lighting on this picture are good. Give this picture a short compliment!`;
      }
    }

    console.log("query string : ", queryString);
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY // store your key in env vars for safety
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: queryString }
      ],
      temperature: 0.7
    });

    console.log("ChatGPT response:", response.choices[0].message.content);


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
