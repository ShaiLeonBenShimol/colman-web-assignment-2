import mongoose from 'mongoose';

interface IPost {
    sender: string,
    title: string,
    content: string
}

const postSchema = new mongoose.Schema<IPost>({
    title: {
        type: String,
        required: true,
    },
    sender: {
        type: String,
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