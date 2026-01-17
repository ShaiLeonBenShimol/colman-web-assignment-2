import mongoose from 'mongoose'
import env from './env';

const database_uri = env.DATABASE_URI;

export const dbConnection = async () => {
    await mongoose.connect(database_uri);
    
    mongoose.connection.on('error', (error) => {
        console.error(error);
    })

    console.log("Connected to database!")
}