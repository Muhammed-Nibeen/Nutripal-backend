import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export interface User {
  _id:string;
  fullName: string;
  email: string;
  password: string
  role: string
  isblocked:Boolean
}


export const generatenewtoken = (token: string): Promise<string | null> => {
  return new Promise((resolve) => {
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
      if (err || !decoded) {
        return resolve(null); 
      }
      const user = decoded as User;

        // Define the payload to be signed
        const plainPayload = {
          fullName: user.fullName,
          email: user.email,
          password: user.password,
          role: user.role,
          isblocked: user.isblocked,
          _id: user._id,
        };
  
        // Create a new access token with the plainPayload
        const newAccessToken = jwt.sign(
          plainPayload,
          process.env.JWT_SECRET as string,
          { expiresIn: '2h' }
        );
        console.log('new token generated repositroy');
        resolve(newAccessToken); // Resolve with the new access token
      });
    });
  };