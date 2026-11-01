import { SignOptions } from "jsonwebtoken";
import { env } from "./env";

export const jwtConfig = {
  secret: env.JWT_SECRET,
  refreshSecret: env.REFRESH_TOKEN_SECRET,
  expiresIn: env.JWT_EXPIRY as SignOptions["expiresIn"],
  refreshExpiresIn: env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"],
};
