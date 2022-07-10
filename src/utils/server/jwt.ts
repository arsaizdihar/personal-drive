import jwt from "jsonwebtoken";
import { NextApiRequest } from "next";

const JWT_TOKEN_KEY = process.env.JWT_TOKEN_KEY || "super duper secret key";
export const cookieOptions = {
  httpOnly: true,
  maxAge: 5 * 24 * 60 * 60,
  path: "/",
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
} as const;

export const getToken = () =>
  jwt.sign({ valid: true }, JWT_TOKEN_KEY, { expiresIn: "5d" });

export const isAuthValid = (req: NextApiRequest) => {
  const token = req.cookies.token;
  if (!token) {
    return false;
  }
  try {
    const valid = jwt.verify(token, JWT_TOKEN_KEY);
    return Boolean(valid);
  } catch (e) {
    return false;
  }
};
