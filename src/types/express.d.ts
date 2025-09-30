// To extend the Express Request interface
declare namespace Express {
    export interface Request {
      user?: {
        id: string;
        email: string;
        role: 'USER' | 'ADMIN';
        iat: number;
        exp: number;
      };
    }
}
