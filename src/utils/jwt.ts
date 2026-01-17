import jwt, { JwtPayload } from 'jsonwebtoken'
import env from './env';
import mongoose from 'mongoose';
import { getUserById, updateUser } from '../controllers/user';

interface JwtUserPayload extends JwtPayload {
  _id: string;
}

type payload = {
  _id: mongoose.Types.ObjectId;
};

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

const tokenConfig = {
  [TokenType.ACCESS]: {
    secret: env.ACCESS_TOKEN_SECRET,
    options: {
      expiresIn: env.JWT_TOKEN_EXPIRATION,
    },
  },
  [TokenType.REFRESH]: {
    secret: env.REFRESH_TOKEN_SECRET,
    options: {},
  },
}

export const generateToken = async (payload: payload, type: TokenType) => {
  const token = tokenConfig[type];
  return await jwt.sign(payload, token.secret, token.options);
}

export const verifyRefreshToken = async (token: string) => {
  const userInfo = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtUserPayload;
  const user = await getUserById(userInfo._id);

  if (!user) {
    throw new Error("invalid token");
  }

  if (!user.tokens.includes(token)) {
    user.tokens = []
    await updateUser(userInfo._id, user);
    throw new Error("invalid token");
  }

  return user;
}

