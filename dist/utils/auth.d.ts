type UserPayload = {
    id: string;
    email: string;
    role: string;
};
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
export declare const createJWT: (user: UserPayload) => string;
export {};
//# sourceMappingURL=auth.d.ts.map