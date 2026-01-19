import supertest from "supertest";
import mongoose from "mongoose";
import { IComment } from "../models/comment";
import commentModel from "../models/comment";
import postModel from "../models/post";
import userModel from "../models/user";
import TestAgent from "supertest/lib/agent";
import { createApp, Mode, TestableApplication } from "../server/server";

let app: TestableApplication;
let request: TestAgent;
let accessToken: string;
let userId: string;

// Test data
const testUser = {
    username: "testuser",
    email: "testuser@example.com",
    password: "password123"
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
    app = await createApp(Mode.TEST);
    request = supertest(app);
    
    // Create test user
    const registerUser = await request.post("/auth/register").send(testUser);
    userId = registerUser.body._id.toString();
    const loggedInUser = await request.post("/auth/login").send(testUser);
    accessToken = loggedInUser.body.accessToken;
    testPost.sender = userId;
    testComment.sender = userId;
    
    // Create test post
    const post = await postModel.create(testPost);
    testComment.postId = post._id.toString();
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (app.close) {
        await app.close()
    }
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
                .set({ authorization: `JWT ${accessToken}` })
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
                .set({ authorization: `JWT ${accessToken}` })
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
                .set({ authorization: `JWT ${accessToken}` })
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
                .set({ authorization: `JWT ${accessToken}` })
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
                .set({ authorization: `JWT ${accessToken}` })
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
                .set({ authorization: `JWT ${accessToken}` })
                .expect(200);
                
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
        });
        
        it("should return comments filtered by postId when postId query parameter is provided", async () => {
            const response = await request
                .get(`/comment?postId=${testComment.postId}`)
                .set({ authorization: `JWT ${accessToken}` })
                .expect(200);
                
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
            response.body.forEach((comment: IComment) => {
                expect(comment.postId).toBe(testComment.postId);
            });
        });
        
        it("should return empty array when no comments exist for given postId", async () => {
            const nonExistentPostId = new mongoose.Types.ObjectId().toString();
            
            const response = await request
                .get(`/comment?postId=${nonExistentPostId}`)
                .set({ authorization: `JWT ${accessToken}` })
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
                .set({ authorization: `JWT ${accessToken}` })
                .expect(200);
                
            expect(response.body).toBeDefined();
            expect(response.body._id).toBe(commentId);
            expect(response.body.content).toBe(testComment.content);
        });
        
        it("should return 400 for invalid comment ID format", async () => {
            const response = await request
                .get("/comment/invalid-id")
                .set({ authorization: `JWT ${accessToken}` })
                .expect(400);
                
            expect(response.text).toBe("Invalid Comment Id");
        });
        
        it("should return 404 for non-existent comment ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            
            const response = await request
                .get(`/comment/${nonExistentId}`)
                .set({ authorization: `JWT ${accessToken}` })
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
                .set({ authorization: `JWT ${accessToken}` })
                .expect(200);
                
            expect(response.body).toBeDefined();
            expect(response.body._id).toBe(commentId);
            
            const deletedComment = await commentModel.findById(commentId);
            expect(deletedComment).toBeNull();
        });
        
        it("should return 400 for invalid comment ID format", async () => {
            const response = await request
                .delete("/comment/invalid-id")
                .set({ authorization: `JWT ${accessToken}` })
                .expect(400);
                
            expect(response.text).toBe("Invalid Comment Id");
        });
        
        it("should return 404 for non-existent comment ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            
            const response = await request
                .delete(`/comment/${nonExistentId}`)
                .set({ authorization: `JWT ${accessToken}` })
                .expect(404);
                
            expect(response.text).toBe("Comment Not Found");
        });
        
        it("Block user from deleting other user's comment", async () => {
            const differentUserId = new mongoose.Types.ObjectId().toString();
            const comment = await commentModel.create({
                ...testComment,
                sender: differentUserId
            });
            commentId = comment._id.toString();
            
            const response = await request
                .delete(`/comment/${commentId}`)
                .set({ authorization: `JWT ${accessToken}` })
                .expect(400);
                
            expect(response.text).toBe("Unauthorized");
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
                .set({ authorization: `JWT ${accessToken}` })
                .send({ content: updatedContent })
                .expect(200);
                
            expect(response.body).toBeDefined();
            expect(response.body._id).toBe(commentId);
            expect(response.body.content).toBe(updatedContent);
            
            const updatedComment = await commentModel.findById(commentId);
            expect(updatedComment?.content).toBe(updatedContent);
        });
        
        it("should return 400 for invalid comment ID format", async () => {
            const response = await request
                .patch("/comment/invalid-id")
                .set({ authorization: `JWT ${accessToken}` })
                .send({ content: "Updated content" })
                .expect(400);
                
            expect(response.text).toBe("Invalid Comment Id");
        });
        
        it("should return 400 when body is missing", async () => {
            const response = await request
                .patch(`/comment/${commentId}`)
                .set({ authorization: `JWT ${accessToken}` })
                .expect(400);
                
            expect(response.text).toBe("Missing Body");
        });
        
        it("should return 400 when content is missing in body", async () => {
            const response = await request
                .patch(`/comment/${commentId}`)
                .set({ authorization: `JWT ${accessToken}` })
                .send({})
                .expect(400);
                
            expect(response.text).toBe("No comment content provided");
        });
        
        it("should return 404 for non-existent comment ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            
            const response = await request
                .patch(`/comment/${nonExistentId}`)
                .set({ authorization: `JWT ${accessToken}` })
                .send({ content: "Updated content" })
                .expect(404);
                
            expect(response.text).toBe("Comment Not Found");
        });
        
        it("Block user from editing other user's comment", async () => {
            const differentUserId = new mongoose.Types.ObjectId().toString();
            const comment = await commentModel.create({
                ...testComment,
                sender: differentUserId
            });
            commentId = comment._id.toString();
            
            const response = await request
                .patch(`/comment/${commentId}`)
                .set({ authorization: `JWT ${accessToken}` })
                .send({ content: "Updated content" })
                .expect(400);
                
            expect(response.text).toBe("Unauthorized");
        });
    });
});