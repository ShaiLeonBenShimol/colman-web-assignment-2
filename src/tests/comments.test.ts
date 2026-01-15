import express from "express";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

import commentModel from "../models/comment";
import postModel from "../models/post";
import userModel from "../models/user";
import { createTestApp, createMongoMemoryDatabase} from "./testUtils";

let app: express.Application;
let mongoServer: MongoMemoryServer;
let request: any;

// Test data
const testUser = {
    username: "testuser",
    email: "testuser@example.com",
    passwordHash: "hashedpassword"
};

const testPost = {
    title: "Test Post",
    content: "This is a test post content",
    sender: ""
};

const testComment = {
    postId: "",
    sender: "",
    content: "This is a test comment"
};

beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await createMongoMemoryDatabase();
    
    // Setup Express app for testing
    app = createTestApp();
    request = supertest(app);
    
    // Create test user
    const user = await userModel.create(testUser);
    testPost.sender = user._id.toString();
    testComment.sender = user._id.toString();
    
    // Create test post
    const post = await postModel.create(testPost);
    testComment.postId = post._id.toString();
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Clean up comments before each test
    await commentModel.deleteMany({});
});

describe("Comment Routes", () => {
    
    describe("POST /comment", () => {
        it("should create a new comment successfully", async () => {
            const response = await request
                .post("/comment")
                .send(testComment)
                .expect(200);
            
            expect(response.body).toBeDefined();
            expect(response.body._id).toBeDefined();
            
            const createdComment = await commentModel.findById(response.body._id);
            expect(createdComment).toBeTruthy();
            expect(createdComment?.content).toBe(testComment.content);
        });
        
        it("should return 400 when body is missing", async () => {
            const response = await request
                .post("/comment")
                .expect(400);
                
            expect(response.text).toBe("Missing Body");
        });
        
        it("should return 400 when postId is missing", async () => {
            const invalidComment = {
                sender: testComment.sender,
                content: testComment.content
            };
            
            const response = await request
                .post("/comment")
                .send(invalidComment)
                .expect(400);
                
            expect(response.text).toBe("Invalid Comment");
        });
        
        it("should return 400 when sender is missing", async () => {
            const invalidComment = {
                postId: testComment.postId,
                content: testComment.content
            };
            
            const response = await request
                .post("/comment")
                .send(invalidComment)
                .expect(400);
                
            expect(response.text).toBe("Invalid Comment");
        });
        
        it("should return 400 when content is missing", async () => {
            const invalidComment = {
                postId: testComment.postId,
                sender: testComment.sender
            };
            
            const response = await request
                .post("/comment")
                .send(invalidComment)
                .expect(400);
                
            expect(response.text).toBe("Invalid Comment");
        });
        
        it("should return 400 when related post does not exist", async () => {
            const invalidComment = {
                postId: new mongoose.Types.ObjectId().toString(),
                sender: testComment.sender,
                content: testComment.content
            };
            
            const response = await request
                .post("/comment")
                .send(invalidComment)
                .expect(400);
                
            expect(response.text).toBe("Related Post Does Not Exist");
        });
    });
    
    describe("GET /comment", () => {
        beforeEach(async () => {
            // Create some test comments
            await commentModel.create([
                { ...testComment },
                { ...testComment, content: "Second comment" },
                { 
                    postId: new mongoose.Types.ObjectId(),
                    sender: testComment.sender,
                    content: "Comment for different post"
                }
            ]);
        });
        
        it("should return all comments when no postId query parameter", async () => {
            const response = await request
                .get("/comment")
                .expect(200);
                
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
        });
        
        it("should return comments filtered by postId when postId query parameter is provided", async () => {
            const response = await request
                .get(`/comment?postId=${testComment.postId}`)
                .expect(200);
                
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
            response.body.forEach((comment: any) => {
                expect(comment.postId).toBe(testComment.postId);
            });
        });
        
        it("should return empty array when no comments exist for given postId", async () => {
            const nonExistentPostId = new mongoose.Types.ObjectId().toString();
            
            const response = await request
                .get(`/comment?postId=${nonExistentPostId}`)
                .expect(200);
                
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });
    });
    
    describe("GET /comment/:id", () => {
        let commentId: string;
        
        beforeEach(async () => {
            const comment = await commentModel.create(testComment);
            commentId = comment._id.toString();
        });
        
        it("should return comment by valid ID", async () => {
            const response = await request
                .get(`/comment/${commentId}`)
                .expect(200);
                
            expect(response.body).toBeDefined();
            expect(response.body._id).toBe(commentId);
            expect(response.body.content).toBe(testComment.content);
        });
        
        it("should return 400 for invalid comment ID format", async () => {
            const response = await request
                .get("/comment/invalid-id")
                .expect(400);
                
            expect(response.text).toBe("Invalid Comment Id");
        });
        
        it("should return 404 for non-existent comment ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            
            const response = await request
                .get(`/comment/${nonExistentId}`)
                .expect(404);
                
            expect(response.text).toBe("Comment Not Found");
        });
    });
    
    describe("DELETE /comment/:id", () => {
        let commentId: string;
        
        beforeEach(async () => {
            const comment = await commentModel.create(testComment);
            commentId = comment._id.toString();
        });
        
        it("should delete comment successfully", async () => {
            const response = await request
                .delete(`/comment/${commentId}`)
                .expect(200);
                
            expect(response.body).toBeDefined();
            expect(response.body._id).toBe(commentId);
            
            const deletedComment = await commentModel.findById(commentId);
            expect(deletedComment).toBeNull();
        });
        
        it("should return 400 for invalid comment ID format", async () => {
            const response = await request
                .delete("/comment/invalid-id")
                .expect(400);
                
            expect(response.text).toBe("Invalid Comment Id");
        });
        
        it("should return 404 for non-existent comment ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            
            const response = await request
                .delete(`/comment/${nonExistentId}`)
                .expect(404);
                
            expect(response.text).toBe("Comment Not Found");
        });
    });
    
    describe("PATCH /comment/:id", () => {
        let commentId: string;
        
        beforeEach(async () => {
            const comment = await commentModel.create(testComment);
            commentId = comment._id.toString();
        });
        
        it("should update comment content successfully", async () => {
            const updatedContent = "Updated comment content";
            
            const response = await request
                .patch(`/comment/${commentId}`)
                .send({ content: updatedContent })
                .expect(200);
                
            expect(response.body).toBeDefined();
            expect(response.body._id).toBe(commentId);
            expect(response.body.content).toBe(updatedContent);
            
            // Verify comment was updated using model directly
            const updatedComment = await commentModel.findById(commentId);
            expect(updatedComment?.content).toBe(updatedContent);
        });
        
        it("should return 400 for invalid comment ID format", async () => {
            const response = await request
                .patch("/comment/invalid-id")
                .send({ content: "Updated content" })
                .expect(400);
                
            expect(response.text).toBe("Invalid Comment Id");
        });
        
        it("should return 400 when body is missing", async () => {
            const response = await request
                .patch(`/comment/${commentId}`)
                .expect(400);
                
            expect(response.text).toBe("Missing Body");
        });
        
        it("should return 400 when content is missing in body", async () => {
            const response = await request
                .patch(`/comment/${commentId}`)
                .send({})
                .expect(400);
                
            expect(response.text).toBe("No comment content provided");
        });
        
        it("should return 404 for non-existent comment ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            
            const response = await request
                .patch(`/comment/${nonExistentId}`)
                .send({ content: "Updated content" })
                .expect(404);
                
            expect(response.text).toBe("Comment Not Found");
        });
    });
});