import mongoose from 'mongoose';

interface IPost {
    sender: mongoose.Types.ObjectId,
    title: string,
    content: string
}

const postSchema = new mongoose.Schema<IPost>({
    title: {
        type: String,
        required: true,
    },
    sender: {
        type:mongoose.Types.ObjectId,
        ref: "users",
        required: true
    },
    content: {
        type: String,
        required: true
    }
});

const postModel = mongoose.model<IPost>("posts", postSchema);

export default postModel;
export { IPost };