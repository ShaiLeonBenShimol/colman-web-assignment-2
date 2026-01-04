import postModel from '../models/post'
import { IPost } from '../models/post'

export const createPost = async (title: string, sender: string, content: string) => {
    await postModel.create({ title, sender, content });
}

export const getPostById = async (id: string) => {
    return await postModel.findById(id);
}

export const getPosts = async () => {
    return await postModel.find();
}

export const getPostsBySender = async (sender: string) => {
    return await postModel.find({ sender: sender });
}

export const updatePost = async (id: string, postBody: IPost) => {
    return await postModel.findByIdAndUpdate(id, postBody, { new: true });
}