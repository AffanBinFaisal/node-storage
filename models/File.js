const mongoose = require("../db/db");

const fileSchema = new mongoose.Schema({
  user: String,
  filename: String,
  path: String,
  size: Number,
},
  {
    timestamps: true, // Add timestamps to the schema
  }
);

// Create a model
const File = mongoose.model('File', fileSchema);

module.exports = File;