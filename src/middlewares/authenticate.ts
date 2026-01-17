import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import env from '../utils/env';

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(" ")[1];
    const secret = env.ACCESS_TOKEN_SECRET;

    if (!token) {
        return res.status(401).send({ message: 'Missing Authorization' });
    }

    jwt.verify(token, secret, (error, user) => {
        if (error) return res.status(403).send(error.message);
        req.user = user as JwtPayload;
        next();
    })
}

export default authenticate