import express from "express";
import { createComment, getComments, getCommentById, deleteComment, updateComment, getCommentsByPostId } from "../controllers/comment";
import { getPostById } from "../controllers/post";
import { isValidObjectId } from "mongoose";
const commentRouter = express.Router();

/**
 * @swagger
 * /comment:
 *   post:
 *     tags: [Comments]
 *     summary: Create a new comment
 *     description: Create a new comment on a post. The sender is automatically taken from the authenticated user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       200:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid comment data or related post does not exist
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Invalid Comment"
 */
commentRouter.post('/', async (req, res) => {
    if (!req.body) {
        return res.status(400).send('Missing Body');
    }

    const { postId, content } = req.body;
    const sender = req.user;

    if (!postId || !sender || !content) {
        return res.status(400).send('Invalid Comment');
    }

    const post = await getPostById(postId);
    
    if (!post) {
        return res.status(400).send('Related Post Does Not Exist');
    }

    const comment = await createComment(postId, sender._id, content);

    res.status(200).send(comment);
})

/**
 * @swagger
 * /comment:
 *   get:
 *     tags: [Comments]
 *     summary: Get all comments or comments by post ID
 *     description: Retrieve all comments, or filter comments by post ID using query parameter.
 *     parameters:
 *       - in: query
 *         name: postId
 *         schema:
 *           type: string
 *         description: Filter comments by post ID
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
commentRouter.get('/', async (req, res) => {
    const postId = req.query.postId as string;

    if (postId) {
        const comments = await getCommentsByPostId(postId);
        return res.status(200).send(comments);
    }
    const comments = await getComments();
    
    res.status(200).send(comments);
})

/**
 * @swagger
 * /comment/{id}:
 *   get:
 *     tags: [Comments]
 *     summary: Get comment by ID
 *     description: Retrieves a comment by its MongoDB ObjectId.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Comment ObjectId (24-character hex string)
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Comment found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid comment ID format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Invalid Comment Id"
 *       404:
 *         description: Comment not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Comment Not Found"
 */
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

/**
 * @swagger
 * /comment/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment
 *     description: Delete a comment by ID. Only the comment owner can delete their comment.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Comment ObjectId to delete
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid comment ID format or unauthorized
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Unauthorized"
 *       404:
 *         description: Comment not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Comment Not Found"
 */
commentRouter.delete('/:id', async (req, res) => {
    const commentId = req.params.id;
    const sender = req.user

    if (!isValidObjectId(commentId)) {
        return res.status(400).send('Invalid Comment Id');
    }

    const existingComment = await getCommentById(commentId);

    if (!existingComment) {
        return res.status(404).send('Comment Not Found');
    }

    if (!sender || sender._id != existingComment.sender) {
        return res.status(400).send('Unauthorized');
    }

    const deletedComment = await deleteComment(commentId);

    if (!deletedComment) {
        return res.status(404).send('Comment Not Found');
    }
    res.status(200).send(deletedComment);
})

/**
 * @swagger
 * /comment/{id}:
 *   patch:
 *     tags: [Comments]
 *     summary: Update a comment
 *     description: Update the content of a comment by ID. Only the comment owner can update their comment.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Comment ObjectId to update
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCommentRequest'
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid comment ID, missing body, unauthorized, or no content provided
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Unauthorized"
 *       404:
 *         description: Comment not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Comment Not Found"
 */
commentRouter.patch('/:id', async (req, res) => {

    const commentId = req.params.id;
    const sender = req.user

    if (!isValidObjectId(commentId)) {
        return res.status(400).send('Invalid Comment Id');
    }

    const existingComment = await getCommentById(commentId);
    
    if (!existingComment) {
        return res.status(404).send('Comment Not Found');
    }

    if (!sender || sender._id != existingComment.sender) {
        return res.status(400).send('Unauthorized');
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