import express, { Request, Response } from "express";
import { createPost, getPosts, getPostById, getPostsBySender, updatePost } from "../controllers/post";
import { isValidObjectId } from "mongoose";

const postRouter = express.Router();

/**
 * @swagger
 * /post:
 *   post:
 *     tags: [Posts]
 *     summary: Create a new post
 *     description: Create a new post with a title and content. The sender is automatically taken from the authenticated user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostRequest'
 *     responses:
 *       200:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid post data
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Invalid Post"
 */
postRouter.post('/', async (req: Request, res: Response) => {
    if (!req.body) {
        return res.status(400).send('Missing Body');
    }
    
    const sender = req.user;
    const { title, content } = req.body;

    if (!title || !content || !sender) {
        return res.status(400).send('Invalid Post');
    }

    const post = await createPost(title, sender._id, content);

    return res.status(200).send(post);
})

/**
 * @swagger
 * /post:
 *   get:
 *     tags: [Posts]
 *     summary: Get all posts or posts by sender
 *     description: Retrieve all posts, or filter posts by the sender's user ID using query parameter.
 *     parameters:
 *       - in: query
 *         name: sender
 *         schema:
 *           type: string
 *         description: Filter posts by sender ID
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
postRouter.get('/', async (req, res) => {
    const sender = req.query.sender as string;

    if (sender) {
        const posts = await getPostsBySender(sender);
        return res.status(200).send(posts);
    }

    const posts = await getPosts();
    return res.status(200).send(posts);
})

/**
 * @swagger
 * /post/{id}:
 *   get:
 *     tags: [Posts]
 *     summary: Get a post by ID
 *     description: Retrieve a single post by its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     responses:
 *       200:
 *         description: Post found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid post ID
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Invalid Post Id"
 *       404:
 *         description: Post not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Post Not Found"
 */
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

/**
 * @swagger
 * /post/{id}:
 *   put:
 *     tags: [Posts]
 *     summary: Update a post by ID
 *     description: Update the title and content of a post. The sender is automatically taken from the authenticated user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePostRequest'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid post or missing body
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Invalid Post"
 *       404:
 *         description: Post not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Post Not Found"
 */
postRouter.put('/:id', async (req, res) => {
    const id = req.params.id; 
    if (!isValidObjectId(id)) {
        return res.status(400).send('Invalid Post Id');
    }

    if (!req.body) {
        return res.status(400).send('Missing Body');
    }

    const sender = req.user
    const { title, content } = req.body;

    if (!title || !sender || !content) {
        return res.status(400).send('Invalid Post');
    }

    const existingPost = await getPostById(id)
    
    if (!existingPost) {
        return res.status(404).send('Post Not Found');
    }

    if (sender._id != existingPost.sender) {
        return res.status(400).send('Unauthorized');
    }

    const post = {
        ...req.body,
        "sender": sender._id
    }

    const updatedPost = await updatePost(id, post);

    if (!updatedPost) {
        return res.status(404).send('Post Not Found');
    }
    res.status(200).send(updatedPost);
})

export default postRouter