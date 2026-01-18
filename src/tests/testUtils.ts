import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server-core/lib/MongoMemoryServer";

export async function createMongoMemoryDatabase() {

    const mongoServer: MongoMemoryServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
        
    await mongoose.connect(mongoUri);
    return mongoServer;
}