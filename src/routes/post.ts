import express from "express";
import { createPost, getPosts } from "../controllers/post";
const postRouter = express.Router();

postRouter.post('/', async (req, res) => {
    if (!req.body) {
        return res.status(400).send('Missing Body');
    }
    
    const { title, sender, content } = req.body;

    if (!title || !sender || !content) {
        return res.status(400).send('Invalid Post');
    }

    const post = await createPost(title, sender, content);
    res.status(200).send(post);
})

postRouter.get('/', async (req, res) => {
    const post = await getPosts();
    res.status(200).send(post);
})

/*
SHAY - Get a Post by ID
*/

/*
SHAY - Get Posts by Sender
*/

/*
SHAY - Update a Post
*/

export default postRouter