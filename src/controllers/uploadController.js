import expressAsyncHandler from "express-async-handler";

export const uploadImage = expressAsyncHandler(async (req, res, next) => {
  try {
    // Multer + Cloudinary automatically attach file info to req.file
    if (!req.file || !req.file.path) {
      return res.status(400).json({
        status: "failure",
        message: "No image uploaded",
      });
    }

    // The uploaded image's Cloudinary URL
    const imageUrl = req.file.path;

    return res.status(201).json({
      status: "success",
      message: "Image uploaded successfully",
      data: {
        imageUrl,
        public_id: req.file.filename, // you can store this in DB for delete later
      },
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({
      status: "failure",
      message: "Error uploading image",
    });
  }
});
