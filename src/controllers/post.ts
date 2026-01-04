import postModel from '../models/post'

export const createPost = async (title: string, sender: string, content: string) => {
    await postModel.create({ title, sender, content });
}

export const getPosts = async () => {
    return await postModel.find();
}