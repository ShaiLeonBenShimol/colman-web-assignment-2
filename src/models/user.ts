import mongoose from 'mongoose';

interface IUser {
    username: string,
    email: string,
    passwordHash: string,
    tokens: string[]
}

const userSchema = new mongoose.Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String, 
        required: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    tokens: {
        type: [String],
        default: []
    }

});

const userModel = mongoose.model<IUser>("users", userSchema);

export default userModel;
export { IUser };