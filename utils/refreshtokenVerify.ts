import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyRefreshToken = async (token: string): Promise<boolean> => {
  try {
    return new Promise((resolve) => {
      jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
        if (err) {
          console.log('not resolve',err);
          return resolve(false); 
        }
        if (user) {
          console.log('refresh toekn verified');
          return resolve(true);
        }
      });
    });
  } catch (error) {
    throw error;
  }
};