const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
    imageSize: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ImageModel = mongoose.model('Image', imageSchema);

module.exports = ImageModel;

