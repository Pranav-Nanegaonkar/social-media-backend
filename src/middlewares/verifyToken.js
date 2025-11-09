import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken; 

  if (!token) {
    return res.status(401).json({ message: "User is not logged in" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded; // attach user info to req

    next(); // move to next middleware or controller
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Invalid or expired token.", error });
  }
};
