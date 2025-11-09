import expressAsyncHandler from "express-async-handler";

export const uploadImage = expressAsyncHandler(async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "failure",
        message: "No image uploaded",
      });
    }

    // Cloudinary's Multer adapter attaches file info
    const imageUrl = req.file.path; // ✅ Cloudinary secure URL
    const publicId = req.file.filename; // ✅ Cloudinary public_id

    return res.status(201).json({
      status: "success",
      message: "Image uploaded successfully",
      data: {
        imageUrl,
        publicId,
      },
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({
      status: "failure",
      message: error.message || "Error uploading image",
    });
  }
});
