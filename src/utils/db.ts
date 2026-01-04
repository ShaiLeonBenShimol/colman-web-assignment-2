import mongoose from 'mongoose'

const database_uri = process.env.DATABASE_URI || 'mongodb://localhost:27017';

export const dbConnection = async () => {
    await mongoose.connect(database_uri);
    
    mongoose.connection.on('error', (error) => {
        console.error(error);
    })

    console.log("Connected to database!")
}