const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const ImageModel = require("./models/ImageModel");
const { createLogEntry } = require("./loggingService");

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

const axios = require("axios");

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    console.log("ALMOSTTTTTT TEHERSSS");

    const userId = req.body.userId;
    console.log("IMAGE SIZEEEEEEEEEEEE ", req.file.size);

    const authUrl = process.env.AUTH_SERVICE + /updateQuotas/ + userId;
    const quotasCheckResponse = await axios.post(authUrl, {
      amount: req.file.size,
      type: "upload",
    });

    console.log("HERE IS TEH RESPONSE DATA MESSAGE");
    console.log(quotasCheckResponse);

    if (quotasCheckResponse.status !== 200) {
      // Check if the quota has been exceeded

      if (quotasCheckResponse.status === 205) {
        return res
          .status(400)
          .json({ message: "Sorry, your quota for the day has exceeded!" });
      } else {
        // For other errors, return a generic error message
        return res
          .status(500)
          .json({ message: "Internal server error BHAI YEH KYA HORAHA HAI" });
      }
    }

    // Quota check passed, proceed with image upload
    const result = await cloudinary.uploader.upload(req.file.path);
    const newImage = new ImageModel({
      public_id: result.public_id,
      userId: userId,
      imageUrl: result.secure_url,
      imageSize: req.file.size,
    });

    // Save the image to the database
    await newImage.save();

    console.log("IMAGE UPLOAD SUCCESSFUL. url->", result.secure_url);

    // Create a log entry
    await createLogEntry(userId, "Image Upload", req.file.size);

    res.status(200).json({
      url: result.secure_url,
      size: req.file.size,
      userId: userId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

router.delete("/remove/:imageId/:publicId/:userId", async (req, res) => {
  try {
    console.log(req);
    const imageId = req.params.imageId;
    const publicId = req.params.publicId;
    const userId = req.params.userId; // have to add user Id in the request body on frontend as well

    const image = await ImageModel.findById(imageId);
    console.log("Image ", image);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    const authUrl = process.env.AUTH_SERVICE + /updateQuotas/ + userId;
    const quotasCheckResponse = await axios.post(authUrl, {
      amount: image.imageSize,
      type: "delete",
    });

    console.log("HERE IS TEH RESPONSE DATA MESSAGE");
    console.log(quotasCheckResponse);

    if (quotasCheckResponse.status !== 200) {
      // Check if the quota has been exceeded
      console.log('quota check response is ok')

      if (quotasCheckResponse.status === 205) {
        console.log('if quota exceeded')
        return res
          .status(400)
          .json({ message: "Sorry, your quota for the day has exceeded!" });
      } else {
        // For other errors, return a generic error message
        console.log('some error occured in quota checking in storage service to auth service comm.')
        return res
          .status(500)
          .json({ message: "Internal server error BHAI YEH KYA HORAHA HAI" });
      }
    }

    // Find the image in the database
    // Remove the image from Cloudinary
    await cloudinary.uploader.destroy(publicId);
    console.log("destroyingggg, public ID", publicId);

    // Remove the image from the database
    await ImageModel.findByIdAndDelete(imageId);

    // Create a log entry for image removal
    await createLogEntry(image.userId, "Image Removal", image.imageSize);

    res.status(200).json({ message: "Image removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

// Route to fetch images for a particular userId
router.get("/images/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch images for the specified user
    const images = await ImageModel.find({ userId: userId });
    res.status(200).json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to remove all images for a particular userId
router.delete("/removeAll/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch all images for the specified user
    const images = await ImageModel.find({ userId: userId });

    // Calculate the total size of images to update quotas
    const totalImageSize = images.reduce(
      (total, image) => total + image.imageSize,
      0
    );

    // Check quotas with the auth service
    const authUrl = process.env.AUTH_SERVICE + /updateQuotas/ + userId;
    const quotasCheckResponse = await axios.post(authUrl, {
      amount: totalImageSize,
      type: "delete",
    });

    if (quotasCheckResponse.status !== 200) {
      // Check if the quota has been exceeded
      if (quotasCheckResponse.status === 205) {
        return res
          .status(400)
          .json({ message: "Sorry, your quota for the day has exceeded!" });
      } else {
        // For other errors, return a generic error message
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    // Loop through each image and remove it from Cloudinary
    for (const image of images) {
      await cloudinary.uploader.destroy(image.public_id);
    }

    // Remove all images from the database
    await ImageModel.deleteMany({ userId: userId });

    // Create a log entry for image removal
    await createLogEntry(userId, "Remove All Images", totalImageSize);

    res.status(200).json({ message: "All images removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

// Route to fetch all images
router.get("/images", async (req, res) => {
  try {
    // Fetch all images
    const images = await ImageModel.find();
    res.status(200).json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
