const express = require("express");
const multer = require("multer");
const cors = require("cors");

// API routes
const picturesRoutes = require('./api/pictures.js');
const usersRoutes = require('./api/users.js');

const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Adjust as needed
};

app.use(cors(corsOptions));

const imageUpload = multer({ storage: multer.memoryStorage() });
// app.use('/api/createpictureImage', imageUpload.single('image'), createpictureImageRoutes);

app.use('/api/pictures', express.json(), picturesRoutes);
app.use('/api/users', express.json(), usersRoutes);

// Server setup
const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
