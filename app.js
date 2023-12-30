const express = require("express");
const mongoose = require("mongoose");
const imageRoutes = require("./imageRoutes");
const cors = require("cors"); // Import the cors package
require("dotenv").config();

const app = express();
app.use(cors());
const port = 3001;

// Connect to MongoDB using your provided connection string
try {
  mongoose.connect(
    "mongodb+srv://syed_abdulrab:syedabdulrab@cluster0.nt7qb.mongodb.net/cloud_storage_svc?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  );
  console.log("Connected to MongoDB");
} catch (error) {
  console.error("Error connecting to MongoDB:", error);
}

// Use the imageRoutes middleware
app.use("/", imageRoutes);

app.listen(port, () => {
  console.log(`NODE STORAGE Server is running on http://localhost:${port}`);
});
