import express from "express";
import { createUser, getUsers, getUserById, getUserByUsername, updateUser, deleteUser } from "../controllers/user";
import { isValidObjectId } from "mongoose";
import bcrypt from "bcrypt";
import { MongoServerError } from "mongodb";

const userRouter = express.Router();

/**
 * @swagger
 * /user:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     description: Creates a new user with a unique username and email. The password is automatically hashed using bcrypt.
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

userRouter.post('/', async (req, res) => {
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
        res.status(200).send(user);
    } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
            return res.status(400).send('Username or email already exists');
        }
        throw error;
    }
})

/**
 * @swagger
 * /user:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     description: Retrieves a list of all users in the system
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
userRouter.get('/', async (req, res) => {

    const users = await getUsers();
    return res.status(200).send(users);
})

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID or username
 *     description: Retrieves a user by MongoDB ObjectId or username.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ObjectId (24-character hex string) or username
 *         schema:
 *           type: string
 *         examples:
 *           objectId:
 *             value: "507f1f77bcf86cd799439011"
 *             summary: MongoDB ObjectId
 *           username:
 *             value: "johndoe"
 *             summary: Username
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "User Not Found"
 */
userRouter.get('/:id', async (req, res) => {
    const id = req.params.id;

    let user;
    
    if (isValidObjectId(id)) {
        user = await getUserById(id);
    } else {
        user = await getUserByUsername(id);
    }

    if (!user) {
        return res.status(404).send('User Not Found');
    }

    res.status(200).send(user);
})

/**
 * @swagger
 * /user/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user information
 *     description: Updates user information by ObjectId. Username cannot be updated. Passwords are automatically hashed.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ObjectId (24-character hex string)
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - invalid ID, missing body, username update attempt, or duplicate email
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               examples:
 *                 invalidId:
 *                   value: "Invalid User Id"
 *                 missingBody:
 *                   value: "Missing Body"
 *                 usernameUpdate:
 *                   value: "Username cannot be updated"
 *                 duplicateEmail:
 *                   value: "Email already exists"
 *       404:
 *         description: User not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "User Not Found"
 */
userRouter.patch('/:id', async (req, res) => {
    const id = req.params.id; 
    if (!isValidObjectId(id)) {
        return res.status(400).send('Invalid User Id');
    }

    if (!req.body) {
        return res.status(400).send('Missing Body');
    }

    if (req.body.username) {
        return res.status(400).send('Username cannot be updated');
    }

    const updateData = { ...req.body };
    if (updateData.password) {
        updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
        delete updateData.password;
    }

    try {
        const updatedUser = await updateUser(id, updateData);

        if (!updatedUser) {
            return res.status(404).send('User Not Found');
        }
        res.status(200).send(updatedUser);
    } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
            return res.status(400).send('Email already exists');
        }
        throw error;
    }
})

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user
 *     description: Permanently deletes a user by ObjectId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ObjectId (24-character hex string)
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             description: The deleted user object
 *       400:
 *         description: Invalid user ID format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Invalid User Id"
 *       404:
 *         description: User not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "User Not Found"
 */
userRouter.delete('/:id', async (req, res) => {
    const id = req.params.id;
    
    if (!isValidObjectId(id)) {
        return res.status(400).send('Invalid User Id');
    }

    const deletedUser = await deleteUser(id);

    if (!deletedUser) {
        return res.status(404).send('User Not Found');
    }
    res.status(200).send(deletedUser);
})

export default userRouter