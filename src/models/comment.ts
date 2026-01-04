import mongoose, { Schema } from 'mongoose';

interface IComment {
    postId: mongoose.Types.ObjectId,
    sender: string,
    content: string
}

const commentSchema = new mongoose.Schema<IComment>({
    postId: {
        type: Schema.Types.ObjectId,
        ref: "posts",
        required: true
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

const commentModel = mongoose.model<IComment>("comments", commentSchema);

export default commentModel;