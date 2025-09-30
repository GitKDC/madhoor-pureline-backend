"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const db_1 = __importDefault(require("../../db"));
const auth_1 = require("../../utils/auth");
const signup = async (req, res) => {
    const { email, name, password } = req.body;
    try {
        const existingUser = await db_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        const user = await db_1.default.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });
        // Also create a cart for the new user
        await db_1.default.cart.create({
            data: {
                userId: user.id
            }
        });
        const token = (0, auth_1.createJWT)(user);
        res.status(201).json({ token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during signup' });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isValid = await (0, auth_1.comparePassword)(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = (0, auth_1.createJWT)(user);
        res.status(200).json({ token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};
exports.login = login;
//# sourceMappingURL=auth.controller.js.map