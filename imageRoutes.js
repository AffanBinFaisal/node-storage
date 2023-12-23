const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const ImageModel = require("./models/ImageModel");
const { createLogEntry } = require('./loggingService');

const router = express.Router();
const port = 3001;

// Cloudinary configuration

// Add to envs later on
cloudinary.config({
  cloud_name: "dckc2dpa8",
  api_key: "469392837637159",
  api_secret: "fbawSDpNcLfxlKMBl5cM2pWlzc4",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
  },
});

const upload = multer({ storage: storage });

// Route to render the upload form
router.get("/upload", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});


// Your existing image service route

const axios = require('axios');

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    console.log("ALMOSTTTTTT TEHERSSS")

    const userId = req.body.userId;
    console.log("IMAGE SIZEEEEEEEEEEEE ", req.file.size);

    // Check quotas with the auth service
    console.log(`http://localhost:3003/updateQuotas/${userId}`)

    const quotasCheckResponse = await axios.post(`http://localhost:3003/updateQuotas/${userId}`, {
      amount: req.file.size,
      type: 'upload',
    });

    console.log(quotasCheckResponse.data);

    if (quotasCheckResponse.status !== 200) {
      // If the quota check fails, return an error response
      return res.json({ message: quotasCheckResponse.data.message });
    }

    // Quota check passed, proceed with image upload
    const result = await cloudinary.uploader.upload(req.file.path);
    const newImage = new ImageModel({
        public_id:result.public_id,
      userId: userId,
      imageUrl: result.secure_url,
      imageSize: req.file.size,
    });

    // Save the image to the database
    await newImage.save();

    console.log('IMAGE UPLOAD SUCCESSFUL. url->', result.secure_url);

    // Create a log entry
    await createLogEntry(userId, 'Image Upload', req.file.size);

    res.status(200).json({
      url: result.secure_url,
      size: req.file.size,
      userId: userId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});


router.delete('/remove/:imageId/:publicId', async (req, res) => {
    try {
      const imageId = req.params.imageId;
      const publicId = req.params.publicId;
  
      // Find the image in the database
      const image = await ImageModel.findById(imageId);
    console.log("Image ",image);
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }
  
      // Remove the image from Cloudinary
      
      await cloudinary.uploader.destroy(publicId);
      console.log("destroyingggg, public ID",publicId);
  
      // Remove the image from the database
      await ImageModel.findByIdAndDelete(imageId);
  
      // Create a log entry for image removal
      await createLogEntry(image.userId, 'Image Removal', image.imageSize);
  
      res.status(200).json({ message: 'Image removed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    }
  });
  


// Route to fetch images for a particular userId
router.get('/images/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Fetch images for the specified user
        const images = await ImageModel.find({ userId: userId });
        res.status(200).json(images);
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to fetch all images
router.get('/images', async (req, res) => {
    try {
        // Fetch all images
        const images = await ImageModel.find();
        res.status(200).json(images);
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



module.exports = router;
