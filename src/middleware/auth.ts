import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


interface CustomUserPayload {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  iat: number;
  exp: number;
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not set in environment variables.');
  }

  if (!bearer || !bearer.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const [, token] = bearer.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token format' });
  }

  try {
    const user = jwt.verify(token, secret) as CustomUserPayload;
    req.user = user;
    next();
  } catch (e) {
    console.error(e);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    next();
}
