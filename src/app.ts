import express from "express";
import bodyParser from 'body-parser';
import { dbConnection } from "./utils/db";

import postRouter from "./routes/post";
import commentRouter from "./routes/comment";

const app = express()
const port = process.env.PORT || 4000;

dbConnection();

app.use(bodyParser.json());
app.use('/post', postRouter);
app.use('/comment', commentRouter)

app.listen(port, () => {
    console.log(`Listening on port ${port}!`)
})