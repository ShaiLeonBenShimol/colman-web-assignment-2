import express from "express";
import { createUser, getUsers, getUserById, getUserByUsername, updateUser, deleteUser } from "../controllers/user";
import { isValidObjectId } from "mongoose";
import bcrypt from "bcrypt";
import { MongoServerError } from "mongodb";
const userRouter = express.Router();

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

userRouter.get('/', async (req, res) => {

    const users = await getUsers();
    return res.status(200).send(users);
})

userRouter.get('/:username', async (req, res) => {
    const username = req.params.username;

    const user = await getUserByUsername(username);

    if (!user) {
        return res.status(404).send('User Not Found');
    }

    res.status(200).send(user);
})

userRouter.get('/:id', async (req, res) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        res.status(400).send('Invalid User Id')
    }

    const user = await getUserById(id);

    if (!user) {
        res.status(404).send('User Not Found');
    }

    res.status(200).send(user);
})

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