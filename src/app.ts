import express from "express";
import bodyParser from 'body-parser';
import { dbConnection } from "./utils/db";
import { specs, swaggerUi } from './utils/swagger';
import env from './utils/env'

import postRouter from "./routes/post";
import commentRouter from "./routes/comment";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";
import authenticate from "./middlewares/authenticate";

const app = express()
const port = env.PORT;

dbConnection();

app.use(bodyParser.json());

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Documentation'
}));

app.use('/auth', authRouter)
app.use('/post', authenticate, postRouter);
app.use('/comment', authenticate, commentRouter)
app.use('/user', authenticate, userRouter);

app.listen(port, () => {
    console.log(`Listening on port ${port}!`)
})