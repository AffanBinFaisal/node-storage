// Importing modules
const express = require("express");
const path = require("path");
// const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require('multer');

// Initializing app
const app = express();

// Importing Models
const File = require("./models/File");

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve HTML form for file upload
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {

  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  const { filename, path, size } = file;
  //const userId = req.user.userId;
  const userId = "657c5c08b8e54622bcb81d09";

  const userFiles = await File.find({ user: userId });
  console.log(userFiles);

  var bytes = 0;

  userFiles.forEach(file => {
    const createdAtDate = new Date(file.createdAt);
    const currentDate = new Date();
    // Calculate the time difference in milliseconds
    const timeDifference = currentDate - createdAtDate;

    // Calculate the number of hours
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    // Check if 24 hours have passed
    if (hoursDifference >= 24) {
      bytes += file.size;
    }
  });

  if (bytes + size > 1000000000000) {
    res.send("Limit exceeded");
  }

  const newFile = File({
    user: userId,
    filename: filename,
    path: path,
    size: size,
  });

  await newFile.save();

  res.send('File uploaded!');
});

// Server Listening
const port = 8000;
app.listen(port, () => {
  console.log("Server running on port 8000.");
});

