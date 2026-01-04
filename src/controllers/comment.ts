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