"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protect = (req, res, next) => {
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
        const user = jsonwebtoken_1.default.verify(token, secret);
        req.user = user;
        next();
    }
    catch (e) {
        console.error(e);
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};
exports.protect = protect;
const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    next();
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=auth.js.map