import express from "express";
import bodyParser from "body-parser";
import commentRouter from "../routes/comment";
import postRouter from "../routes/post";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server-core/lib/MongoMemoryServer";
import userRouter from "../routes/user";


export function createTestApp(): express.Application {
    const app = express();
    
    app.use(bodyParser.json());
    
    app.use("/comment", commentRouter);
    app.use("/post", postRouter);
    app.use("/user", userRouter);
    
    return app;
}

export async function createMongoMemoryDatabase() {

    const mongoServer: MongoMemoryServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
        
    await mongoose.connect(mongoUri);
    return mongoServer;
}