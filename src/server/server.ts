import express, { Application } from "express";
import { dbConnection } from "../utils/db";
import { createMongoMemoryDatabase } from "../tests/testUtils";
import bodyParser from "body-parser";

import postRouter from "../routes/post";
import commentRouter from "../routes/comment";
import userRouter from "../routes/user";
import authRouter from "../routes/auth";
import authenticate from "../middlewares/authenticate";

export enum Mode {
  PROD = 'production',
  TEST = 'test',
}

export interface TestableApplication extends Application {
  close?: () => Promise<void>;
}

export const createApp = async (appMmode?: Mode) => {
    const mode = appMmode || Mode.PROD;
    const app: TestableApplication = express();

    if (mode == Mode.PROD) {    
        dbConnection();
    } else {
        const testMongoServer = await createMongoMemoryDatabase();

        app.close = async () => {
            await testMongoServer.stop()
        }
    }

    app.use(bodyParser.json());
    app.use('/auth', authRouter)
    app.use('/post', authenticate, postRouter);
    app.use('/comment', authenticate, commentRouter)
    app.use('/user', authenticate, userRouter);

    return app;
}