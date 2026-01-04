import express from "express";
import { createPost, getPosts, getPostById, getPostsBySender, updatePost } from "../controllers/post";
import { get, isValidObjectId } from "mongoose";
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
    const sender = req.query.sender as string;

    if (sender) {
        const posts = await getPostsBySender(sender);
        return res.status(200).send(posts);
    }

    const posts = await getPosts();
    return res.status(200).send(posts);
})

postRouter.get('/:id', async (req, res) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        res.status(400).send('Invalid Post Id')
    }

    const post = await getPostById(id);

    if (!post) {
        res.status(404).send('Post Not Found');
    }

    res.status(200).send(post);
})

postRouter.put('/:id', async (req, res) => {
    const id = req.params.id; 
    if (!isValidObjectId(id)) {
        return res.status(400).send('Invalid Post Id');
    }

    if (!req.body) {
        return res.status(400).send('Missing Body');
    }

    const { title, sender, content } = req.body;

    if (!title || !sender || !content) {
        return res.status(400).send('Invalid Post');
    }

    const updatedPost = await updatePost(id, req.body);

    if (!updatedPost) {
        return res.status(404).send('Post Not Found');
    }
    res.status(200).send(updatedPost);
})

export default postRouter