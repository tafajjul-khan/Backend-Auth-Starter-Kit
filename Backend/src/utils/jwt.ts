import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET

export interface UserTokenPayload extends JwtPayload {
  userId: string ;
  email: string;
}


// export const generateToken = (payload: UserTokenPayload, secret: string ,expiresIn: SignOptions['expiresIn']): string => {
//   return jwt.sign(payload, secret, {expiresIn});
// };



export const generateToken = (
  payload: UserTokenPayload, 
  secret: string, 
  expiresIn: SignOptions["expiresIn"]
): string => {
  return jwt.sign(payload, secret, {
    ...(expiresIn !== undefined && { expiresIn })
  });
};


export const verifyToken = (token: string, secret: string): UserTokenPayload => {
  try {
    const decode = jwt.verify(token, secret) as UserTokenPayload;
    return decode;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
