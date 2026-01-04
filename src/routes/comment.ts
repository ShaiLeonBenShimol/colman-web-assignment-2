import express from "express";
import { createComment, getComments, getCommentById, deleteComment, updateComment, getCommentsByPostId } from "../controllers/comment";
import { getPostById } from "../controllers/post";
import { get, isValidObjectId } from "mongoose";
const commentRouter = express.Router();

commentRouter.post('/', async (req, res) => {
    if (!req.body) {
        return res.status(400).send('Missing Body');
    }

    const { postId, sender, content } = req.body;

    if (!postId || !sender || !content) {
        return res.status(400).send('Invalid Comment');
    }

    const post = await getPostById(postId);
    
    if (!post) {
        return res.status(400).send('Related Post Does Not Exist');
    }

    const comment = await createComment(postId, sender, content);

    res.status(200).send(comment);
})

commentRouter.get('/', async (req, res) => {
    const postId = req.query.postId as string;

    if (postId) {
        const comments = await getCommentsByPostId(postId);
        return res.status(200).send(comments);
    }
    const comments = await getComments();
    
    res.status(200).send(comments);
})

commentRouter.get('/:id', async (req, res) => {
    const id = req.params.id;
    
    if (!isValidObjectId(id)) {
        res.status(400).send('Invalid Comment Id')
    }
    
    const comment = await getCommentById(id);

    if (!comment) {
        res.status(404).send('Comment Not Found')
    }

    res.status(200).send(comment);
})

commentRouter.delete('/:id', async (req, res) => {
    const commentId = req.params.id;
    
    if (!isValidObjectId(commentId)) {
        return res.status(400).send('Invalid Comment Id');
    }

    const deletedComment = await deleteComment(commentId);

    if (!deletedComment) {
        return res.status(404).send('Comment Not Found');
    }
    res.status(200).send(deletedComment);
})

commentRouter.patch('/:id', async (req, res) => {

    const commentId = req.params.id;
    if (!isValidObjectId(commentId)) {
        return res.status(400).send('Invalid Comment Id');
    }

    if (!req.body) {
        return res.status(400).send('Missing Body');
    }

    const { content } = req.body;

    if (!content) {
        return res.status(400).send('No comment content provided');
    }

    const updatedComment = await updateComment(commentId, content);

    if (!updatedComment) {
        return res.status(404).send('Comment Not Found');
    }
    res.status(200).send(updatedComment);
})

export default commentRouter