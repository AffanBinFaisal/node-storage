const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const ImageModel = require("./models/ImageModel");

const router = express.Router();


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


router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const userId = req.body.userId;

        const result = await cloudinary.uploader.upload(req.file.path);

        const newImage = new ImageModel({
            userId: userId, 
            imageUrl: result.secure_url,
            imageSize: req.file.size,
        });
        await newImage.save();

        console.log('IMAGE UPLOAD SUCCESSFUL. url->', result.secure_url);

        res.status(200).json({
            url: result.secure_url,
            size: req.file.size,
            userId: userId,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred');
    }
});

router.delete('/remove/:imageId', async (req, res) => {
    try {
        const imageId = req.params.imageId;

        // Find the image in the database
        const image = await ImageModel.findById(imageId);

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Remove the image from Cloudinary
        await cloudinary.uploader.destroy(image.publicId);

        // Remove the image from the database
        await ImageModel.findByIdAndRemove(imageId);

        res.status(200).json({ message: 'Image removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});



module.exports = router;
