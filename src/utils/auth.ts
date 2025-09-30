import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

type UserPayload = {
  id: string;
  email: string;
  role: string;
};

export const hashPassword = (password: string) => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const createJWT = (user : UserPayload) => {
  const secret = process.env.JWT_SECRET;

  if(!secret){
    console.error("JWT SECRET not found in enviornment variables");
    throw new Error("JWT_SECRET environment variable is not set!");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: '1d' }
  );
  return token;
};
