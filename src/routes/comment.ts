import express from "express";
import { createComment, getComments, getCommentById } from "../controllers/comment";
import { isValidObjectId } from "mongoose";
const commentRouter = express.Router();

commentRouter.post('/', async (req, res) => {
    if (!req.body) {
        return res.status(400).send('Missing Body');
    }

    const { postId, sender, content } = req.body;

    if (!postId || !sender || !content) {
        return res.status(400).send('Invalid Comment');
    }

    /*
    SHAY - Add a check that a post with that ID exists
    */

    const post = await createComment(postId, sender, content);

    res.status(200).send(post);
})

commentRouter.get('/', async (req, res) => {
    const post = await getComments();
    
    res.status(200).send(post);
})

commentRouter.get('/:id', async (req, res) => {
    const id = req.params.id;
    
    if (!isValidObjectId(id)) {
        res.status(400).send('Invalid Comment Id')
    }
    
    const post = await getCommentById(id);

    if (!post) {
        res.status(404).send('Comment Not Found')
    }

    res.status(200).send(post);
})

/*
SHAY - delete comment
*/

/*
SHAY - update comment
*/

export default commentRouter