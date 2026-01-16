import express from "express";
import bodyParser from 'body-parser';
import { dbConnection } from "./utils/db";
import { specs, swaggerUi } from './utils/swagger';

import postRouter from "./routes/post";
import commentRouter from "./routes/comment";
import userRouter from "./routes/user";

const app = express()
const port = process.env.PORT || 4000;

dbConnection();

app.use(bodyParser.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Documentation'
}));

app.use('/post', postRouter);
app.use('/comment', commentRouter)
app.use('/user', userRouter);

app.listen(port, () => {
    console.log(`Listening on port ${port}!`)
})