import express from "express";
import bcrypt from "bcrypt";
import { createUser, getUserByUsername, updateUser } from "../controllers/user";
import { MongoServerError } from "mongodb";
import { generateToken, verifyRefreshToken, TokenType } from "../utils/jwt"
import authenticate from "../middlewares/authenticate";

const authRouter = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     description: Registers a new user with a unique username and email. Password is hashed using bcrypt.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request or duplicate user
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Username or email already exists
 */

authRouter.post('/register', async (req, res) => {
    if (!req.body) {
        return res.status(400).send('Missing Body');
    }
    
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('Invalid User');
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await createUser(username, email, passwordHash);
        return res.status(200).send(user);
    } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
            return res.status(400).send('Username or email already exists');
        }
        throw error;
    }
})

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     security: []
 *     description: Authenticates user credentials and returns access & refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         description: Invalid credentials
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Invalid Credentials
 */

authRouter.post('/login', async (req, res) => {
    if (!req.body) {
        return res.status(400).send('Missing Credentials');
    }
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Invalid Credentials');
    }

    try {
        const user = await getUserByUsername(username);
        if (!user) return res.status(400).send('Invalid Credentials');

        const hashMatch = await bcrypt.compare(password, user.passwordHash)
        if (!hashMatch) return res.status(400).send('Invalid Credentials');
        
        const accessToken = await generateToken({'_id': user._id}, TokenType.ACCESS)
        const refreshToken = await generateToken({'_id': user._id}, TokenType.REFRESH)

        user.tokens.push(refreshToken);

        await updateUser(user._id.toString(), user)


        res.status(200).send({
            'accessToken': accessToken,
            'refreshToken': refreshToken
        });

    } catch (err) {
        return res.status(400).send(err);
    }
})

/**
 * @swagger
 * /auth/refreshToken:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh tokens
 *     security: []
 *     description: Generates a new access token and refresh token using a valid refresh token.
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Unauthorized
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Unauthorized
 *       400:
 *         description: Invalid refresh token
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Invalid refresh token
 */

authRouter.post('/refreshToken', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(" ")[1];

        if (!token) {
            return res.status(401).send("Unauthorized");
        }

        const user = await verifyRefreshToken(token);
        const accessToken = await generateToken({'_id': user._id}, TokenType.ACCESS)
        const refreshToken = await generateToken({'_id': user._id}, TokenType.REFRESH)

        user.tokens[user.tokens.indexOf(token)] = refreshToken;
        await updateUser(user._id.toString(), user)

        return res.status(200).send({
            'accessToken': accessToken,
            'refreshToken': refreshToken
        });
    } catch (err) {
        return res.status(400).send(err)
    }
})

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     description: Logs out the user by invalidating a refresh token.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Unauthorized
 *       400:
 *         description: Invalid session
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Invalid User Session
 */

authRouter.post('/logout', authenticate, async (req, res) => {
    try {
        const token = req.body.refreshToken;

        if (!token) {
            return res.status(401).send("Unauthorized");
        }
        const user = await verifyRefreshToken(token);

        if (user.tokens.includes(token)) {
            user.tokens.splice(user.tokens.indexOf(token), 1);
            await updateUser(user._id.toString(), user)
        }
        
        return res.status(200).send();
    } catch (error) {
        return res.status(400).send(error)
    }
})

export default authRouter;