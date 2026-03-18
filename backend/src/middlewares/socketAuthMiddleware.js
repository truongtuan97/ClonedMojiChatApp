import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Unauthorized - Token khong ton tai"));
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded) {
      return next(new Error("Unauthorized - Token khong hop le hoac da het han."));
    }

    const user = await User.findById(decoded.userId).select("-hashedPassword");

    if (!user) {
      return next(new Error("User khong ton tai."))
    }
    socket.user = user;

    next();
  } catch (error) {
    console.error("Loi verify jwt trong Socket Auth Middleware ", error);
    next(new Error("Unauthorized"));
  }
}