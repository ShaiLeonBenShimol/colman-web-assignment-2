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
 *     summary: Register a new User
 *     description: Registers a new user with a unique username and email. The password is automatically hashed using bcrypt.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - missing body, invalid user data, or duplicate username/email
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Username or email already exists"
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
 *     summary: Login as User
 *     description: Login in as a user and provide access tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: User Logged In successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Logged In Successfully!"
 *       400:
 *         description: Bad request - Invalid User or Password
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Invalid User or Password"
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

        if (!user.tokens) {
            user.tokens = [refreshToken]
        } else {
            user.tokens.push(refreshToken);
        }
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
 *     summary: refresh Token
 *     description: Refresh Access token and Access token.
 *     responses:
 *       200:
 *         description: User requested tokens successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Logged In Successfully!"
 *       400:
 *         description: Bad request - Invalid token
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Invalid token"
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

        res.status(200).send({
            'accessToken': accessToken,
            'refreshToken': refreshToken
        });
    } catch (err) {
        res.status(400).send(err)
    }
})

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logs Out
 *     description: Logs Out as the User.
 *     responses:
 *       200:
 *         description: User Logged Out Successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Logged In Successfully!"
 *       400:
 *         description: Invalid Request
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Invalid User Session"
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