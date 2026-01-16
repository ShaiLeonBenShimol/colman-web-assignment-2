import userModel from '../models/user'
import { IUser } from '../models/user'

export const createUser = async (username: string, email: string, passwordHash: string) => {
    return await userModel.create({ username, email, passwordHash });
}

export const getUserById = async (id: string) => {
    return await userModel.findById(id);
}

export const getUsers = async () => {
    return await userModel.find();
}

export const getUserByUsername = async (username: string) => {
    return await userModel.findOne({ username: username });
}

export const updateUser = async (id: string, userBody: IUser) => {  
    return await userModel.findByIdAndUpdate(id, userBody, { new: true });
}

export const deleteUser = async (id: string) => {
    return await userModel.findByIdAndDelete(id);
}