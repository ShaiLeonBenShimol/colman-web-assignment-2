import express from "express";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import userModel from "../models/user";
import { createTestApp, createMongoMemoryDatabase } from "./testUtils";
import TestAgent from "supertest/lib/agent";

let app: express.Application;
let mongoServer: MongoMemoryServer;
let request: TestAgent;

// Test data
const testUser = {
    username: "testuser",
    email: "testuser@example.com",
    password: "testpassword123"
};

const testUser2 = {
    username: "testuser2",
    email: "testuser2@example.com",
    password: "testpassword456"
};

beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await createMongoMemoryDatabase();
    
    // Setup Express app for testing
    app = createTestApp();
    request = supertest(app);
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Clean up users before each test
    await userModel.deleteMany({});
});

// Helper function to create a user with hashed password
const createUserWithHashedPassword = async (userData: { username: string; email: string; password: string }) => {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    return await userModel.create({
        username: userData.username,
        email: userData.email,
        passwordHash: passwordHash
    });
};

describe("User Routes", () => {
    
    describe("POST /user", () => {
        it("should create a new user successfully", async () => {
            const response = await request
                .post("/user")
                .send(testUser)
                .expect(200);
            
            expect(response.body).toBeDefined();
            expect(response.body._id).toBeDefined();
            
            const createdUser = await userModel.findById(response.body._id);
            expect(createdUser).toBeTruthy();
            expect(createdUser?.username).toBe(testUser.username);
            expect(createdUser?.email).toBe(testUser.email);
            // Verify password was hashed
            expect(createdUser?.passwordHash).not.toBe(testUser.password);
            expect(await bcrypt.compare(testUser.password, createdUser?.passwordHash || "")).toBe(true);
        });
        
        it("should return 400 when body is missing", async () => {
            const response = await request
                .post("/user")
                .expect(400);
                
            expect(response.text).toBe("Missing Body");
        });
        
        it("should return 400 when username is missing", async () => {
            const invalidUser = {
                email: testUser.email,
                password: testUser.password
            };
            
            const response = await request
                .post("/user")
                .send(invalidUser)
                .expect(400);
                
            expect(response.text).toBe("Invalid User");
        });
        
        it("should return 400 when email is missing", async () => {
            const invalidUser = {
                username: testUser.username,
                password: testUser.password
            };
            
            const response = await request
                .post("/user")
                .send(invalidUser)
                .expect(400);
                
            expect(response.text).toBe("Invalid User");
        });
        
        it("should return 400 when password is missing", async () => {
            const invalidUser = {
                username: testUser.username,
                email: testUser.email
            };
            
            const response = await request
                .post("/user")
                .send(invalidUser)
                .expect(400);
                
            expect(response.text).toBe("Invalid User");
        });
        
        it("should return 400 when username already exists", async () => {
            // Create first user
            await request
                .post("/user")
                .send(testUser)
                .expect(200);
                
            // Try to create user with same username but different email
            const duplicateUsernameUser = {
                username: testUser.username,
                email: "different@example.com",
                password: "differentpassword"
            };
            
            const response = await request
                .post("/user")
                .send(duplicateUsernameUser)
                .expect(400);
                
            expect(response.text).toBe("Username or email already exists");
        });
        
        it("should return 400 when email already exists", async () => {
            // Create first user
            await request
                .post("/user")
                .send(testUser)
                .expect(200);
                
            // Try to create user with same email but different username
            const duplicateEmailUser = {
                username: "differentuser",
                email: testUser.email,
                password: "differentpassword"
            };
            
            const response = await request
                .post("/user")
                .send(duplicateEmailUser)
                .expect(400);
                
            expect(response.text).toBe("Username or email already exists");
        });
    });
    
    describe("GET /user", () => {
        beforeEach(async () => {
            // Create some test users
            await createUserWithHashedPassword(testUser);
            await createUserWithHashedPassword(testUser2);
        });
        
        it("should return all users", async () => {
            const response = await request
                .get("/user")
                .expect(200);
                
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        });
    });
    
    describe("GET /user/:id", () => {
        let userId: string;
        
        beforeEach(async () => {
            const user = await createUserWithHashedPassword(testUser);
            userId = user._id.toString();
        });
        
        it("should return user by valid ID", async () => {
            const response = await request
                .get(`/user/${userId}`)
                .expect(200);
                
            expect(response.body).toBeDefined();
            expect(response.body._id).toBe(userId);
        });
        
        it("should return user by valid username", async () => {
            const response = await request
                .get(`/user/${testUser.username}`)
                .expect(200);
                
            expect(response.body).toBeDefined();
            expect(response.body._id).toBe(userId);
            expect(response.body.username).toBe(testUser.username);
        });
        
        it("should return 404 for non-existent username", async () => {
            const response = await request
                .get("/user/nonexistentuser")
                .expect(404);
                
            expect(response.text).toBe("User Not Found");
        });
        
        it("should return 404 for non-existent user ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            
            const response = await request
                .get(`/user/${nonExistentId}`)
                .expect(404);
                
            expect(response.text).toBe("User Not Found");
        });
    });
    
    describe("PATCH /user/:id", () => {
        let userId: string;
        
        beforeEach(async () => {
            const user = await createUserWithHashedPassword(testUser);
            userId = user._id.toString();
        });
        
        it("should update user email successfully", async () => {
            const updatedEmail = "updated@example.com";
            
            const response = await request
                .patch(`/user/${userId}`)
                .send({ email: updatedEmail })
                .expect(200);
                
            expect(response.body).toBeDefined();
            expect(response.body._id).toBe(userId);
            expect(response.body.email).toBe(updatedEmail);
            
            const updatedUser = await userModel.findById(userId);
            expect(updatedUser?.email).toBe(updatedEmail);
        });
        
        it("should update user password successfully", async () => {
            const newPassword = "newpassword123";
            
            const response = await request
                .patch(`/user/${userId}`)
                .send({ password: newPassword })
                .expect(200);
                
            expect(response.body).toBeDefined();
            expect(response.body._id).toBe(userId);
            
            const updatedUser = await userModel.findById(userId);
            expect(await bcrypt.compare(newPassword, updatedUser?.passwordHash || "")).toBe(true);
        });
        
        it("should return 400 for invalid user ID format", async () => {
            const response = await request
                .patch("/user/invalid-id")
                .send({ email: "updated@example.com" })
                .expect(400);
                
            expect(response.text).toBe("Invalid User Id");
        });
        
        it("should return 400 when body is missing", async () => {
            const response = await request
                .patch(`/user/${userId}`)
                .expect(400);
                
            expect(response.text).toBe("Missing Body");
        });
        
        it("should return 400 when trying to update username", async () => {
            const response = await request
                .patch(`/user/${userId}`)
                .send({ username: "newusername" })
                .expect(400);
                
            expect(response.text).toBe("Username cannot be updated");
        });
        
        it("should return 400 when email already exists", async () => {

            await createUserWithHashedPassword(testUser2);
            
            const response = await request
                .patch(`/user/${userId}`)
                .send({ email: testUser2.email })
                .expect(400);
                
            expect(response.text).toBe("Email already exists");
        });
        
        it("should return 404 for non-existent user ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            
            const response = await request
                .patch(`/user/${nonExistentId}`)
                .send({ email: "updated@example.com" })
                .expect(404);
                
            expect(response.text).toBe("User Not Found");
        });
    });
    
    describe("DELETE /user/:id", () => {
        let userId: string;
        
        beforeEach(async () => {
            const user = await createUserWithHashedPassword(testUser);
            userId = user._id.toString();
        });
        
        it("should delete user successfully", async () => {
            const response = await request
                .delete(`/user/${userId}`)
                .expect(200);
                
            expect(response.body).toBeDefined();
            expect(response.body._id).toBe(userId);
            
            const deletedUser = await userModel.findById(userId);
            expect(deletedUser).toBeNull();
        });
        
        it("should return 400 for invalid user ID format", async () => {
            const response = await request
                .delete("/user/invalid-id")
                .expect(400);
                
            expect(response.text).toBe("Invalid User Id");
        });
        
        it("should return 404 for non-existent user ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            
            const response = await request
                .delete(`/user/${nonExistentId}`)
                .expect(404);
                
            expect(response.text).toBe("User Not Found");
        });
    });
});