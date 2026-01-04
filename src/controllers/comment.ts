import commentModel from '../models/comment'

export const createComment = async (postId: string, sender: string, content: string) => {
    await commentModel.create({postId , sender, content});
}

export const getComments = async () => {
    return await commentModel.find();
}

export const getCommentById = async (commentId: string) => {
    return await commentModel.findById(commentId);
}

export const deleteComment = async (commentId: string) => {
    return await commentModel.findByIdAndDelete(commentId);
} 

export const updateComment = async (commentId: string, content: string) => {
    return await commentModel.findByIdAndUpdate(commentId, { content }, { new: true });
}

export const getCommentsByPostId = async (postId: string) => {
    return await commentModel.find({ postId: postId });
}