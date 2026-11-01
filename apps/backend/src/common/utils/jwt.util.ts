import jwt from "jsonwebtoken";
import { jwtConfig } from "../../config/jwt.config";

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
}

export const signAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
    });
};

export const signRefreshToken = (userId: string): string => {
    return jwt.sign({ id: userId }, jwtConfig.refreshSecret, {
        expiresIn: jwtConfig.refreshExpiresIn,
    });
};

export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token, jwtConfig.secret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): { id: string } => {
    return jwt.verify(token, jwtConfig.refreshSecret) as { id: string };
};
