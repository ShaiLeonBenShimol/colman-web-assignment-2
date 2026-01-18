import supertest from "supertest";
import mongoose from "mongoose";
import postModel from "../models/post";
import TestAgent from "supertest/lib/agent";
import { createApp, Mode, TestableApplication } from "../server/server";

let app: TestableApplication;
let request: TestAgent;
let accessToken: string = '';
let userId: string = '';

const testUser = {
    username: "testuser",
    email: "testuser@example.com",
    password: "hashedpassword"
};

const testPost = {
    title: "titletest",
    content: "this is content"
}

const badPost = {
    title: "titletest",
    content1: "this is content"
}

beforeAll(async () => {
    app = await createApp(Mode.TEST);
    request = supertest(app);
    
    // Create test user
    const registerUser = await request.post("/auth/register").send(testUser);
    console.log(registerUser)
    userId = registerUser.body._id.toString();
    const loggedInUser = await request.post("/auth/login").send(testUser);
    accessToken = loggedInUser.body.accessToken;
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (app.close) {
        await app.close()
    }
});

beforeEach(async () => {
    await postModel.deleteMany({});
});

describe("Create Post", () => {
    it("should create a new post", async () => {
        const response = await request.post("/post").set({authorization: `JWT ${accessToken}`}).send(testPost).expect(200);
        
        expect(response.body).toBeDefined();
        expect(response.body._id).toBeDefined();
        
        const post = await postModel.findById(response.body._id);
        expect(post).toBeTruthy();
        expect(post?.content).toBe(testPost.content);
    });
    
    it("should return 400 when body is missing", async () => {
        const response = await request.post("/post").set({authorization: `JWT ${accessToken}`}).expect(400);
            
        expect(response.text).toBe("Missing Body");
    });
    
    it("should return 400 when field is missing", async () => {
        const response = await request.post("/post").set({authorization: `JWT ${accessToken}`}).send(badPost).expect(400);
            
        expect(response.text).toBe("Invalid Post");
    });
})

describe("Get Posts", () => {
    beforeEach(async () => {
        // Create some posts
        await postModel.create([
            { ...testPost, sender: userId },
            { ...testPost, sender: userId },
            { 
                sender: new mongoose.Types.ObjectId(),
                title: "secret post",
                content: "this is post by secret user"
            }
        ]);
    });

    it("should return all posts", async () => {
        const response = await request.get("/post").set({authorization: `JWT ${accessToken}`}).expect(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);
    });
    
    it("should return posts by sender", async () => {
        const response = await request.get(`/post?sender=${userId}`).set({authorization: `JWT ${accessToken}`}).expect(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
    });
    
    it("should return empty array when no posts from sender", async () => {
        const nonExistentUserId = new mongoose.Types.ObjectId().toString();
        const response = await request.get(`/post?sender=${nonExistentUserId}`).set({authorization: `JWT ${accessToken}`}).expect(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });
})

describe("Get Post By Id", () => {
    let postId: string;
        
    beforeEach(async () => {
        const post = await postModel.create({ ...testPost, sender: userId });
        postId = post._id.toString();
    });
    
    it("return post by Id", async () => {
        const response = await request.get(`/post/${postId}`).set({authorization: `JWT ${accessToken}`}).expect(200);
        expect(response.body).toBeDefined();
        expect(response.body._id).toBe(postId);
        expect(response.body.content).toBe(testPost.content);
    });
    
    it("Invalid post ID format", async () => {
        const response = await request.get("/post/invalid-id").set({authorization: `JWT ${accessToken}`}).expect(400);
        expect(response.text).toBe("Invalid Post Id");
    });
    
    it("Non-existent post ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const response = await request.get(`/post/${nonExistentId}`).set({authorization: `JWT ${accessToken}`}).expect(404);
        expect(response.text).toBe("Post Not Found");
    });
})

describe("Update Post By Id", () => {
    let postId: string;
        
    beforeEach(async () => {
        const post = await postModel.create({ ...testPost, sender: userId });
        postId = post._id.toString();
    });
    
    it("update post content successfully", async () => {
        const updatedPost = {
            title: "newtitle",
            content: "Updated post content"
        };
        const response = await request.put(`/post/${postId}`).set({authorization: `JWT ${accessToken}`}).send(updatedPost).expect(200);
        expect(response.body).toBeDefined();
        expect(response.body._id).toBe(postId);
        expect(response.body.title).toBe(updatedPost.title);
        expect(response.body.content).toBe(updatedPost.content);        
        const post = await postModel.findById(postId);
        expect(post?.title).toBe(updatedPost.title);
        expect(post?.content).toBe(updatedPost.content);
    });
    
    it("should return 400 for invalid post ID format", async () => {
        const updatedPost = {
            title: "newtitle",
            content: "Updated post content"
        };
        const response = await request.put("/post/invalid-id").set({authorization: `JWT ${accessToken}`}).send(updatedPost).expect(400);
        expect(response.text).toBe("Invalid Post Id");
    });
    
    it("should return 400 when body is missing", async () => {
        const response = await request.put(`/post/${postId}`).set({authorization: `JWT ${accessToken}`}).expect(400);
        expect(response.text).toBe("Missing Body");
    });
    
    it("should return 400 when field is missing in body", async () => {
        const response = await request.put(`/post/${postId}`).set({authorization: `JWT ${accessToken}`}).send({}).expect(400);
        expect(response.text).toBe("Invalid Post");
    });
    
    it("should return 404 for non-existent post ID", async () => {
        const updatedPost = {
            title: "newtitle",
            content: "Updated post content"
        };
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const response = await request.put(`/post/${nonExistentId}`).set({authorization: `JWT ${accessToken}`}).send(updatedPost).expect(404);
        expect(response.text).toBe("Post Not Found");
    });

    it("Block user from editing other user's post", async () => {
        const updatedPost = {
            title: "newtitle",
            content: "Updated post content"
        };
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const post = await postModel.create({ ...testPost, sender: nonExistentId });
        postId = post._id.toString();
        const response = await request.put(`/post/${postId}`).set({authorization: `JWT ${accessToken}`}).send(updatedPost).expect(400);
        expect(response.text).toBe("Unauthorized");
    });
    
})