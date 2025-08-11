// middlewares/verifyToken.js
import jwt from "jsonwebtoken";
import { sendResponse } from "./responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendResponse(
      res,
      HttpResponse.UNAUTHORIZED.code,
      "Access token missing or invalid",
      null,
      false
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Pass all decoded fields so you keep role
    req.user = decoded; 
    req.admin = decoded; // Optional, if you want admin convenience

    next();
  } catch (err) {
    return sendResponse(
      res,
      HttpResponse.FORBIDDEN.code,
      "Invalid or expired token",
      null,
      false
    );
  }
};

