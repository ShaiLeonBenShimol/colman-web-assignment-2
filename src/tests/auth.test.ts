import supertest from "supertest";
import mongoose from "mongoose";
import TestAgent from "supertest/lib/agent";
import { createApp, Mode, TestableApplication } from "../server/server";
import userModel from "../models/user";
import { verifyRefreshToken } from "../utils/jwt";

let app: TestableApplication;
let request: TestAgent;
let accessToken: string = '';
let refreshToken: string = '';

const testUser = {
    username: "testuser",
    email: "testuser@example.com",
    password: "testpassword123"
};

const badTestUser = {
    username: "testuser",
    email: "testuser@example.com"
};

beforeAll(async () => {
    app = await createApp(Mode.TEST)
    request = supertest(app);
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (app.close) {
        await app.close()
    }
});

describe("Restric Access without Auth / ", () => {
    it("should return 401 when missing Auth", async () => {
        await request.get("/post").expect(401);
        await request.get("/comment").expect(401);
        await request.get("/user").expect(401);
    });
})

describe("Register", () => {
    it("Add new user", async () => {
        const response = await request.post("/auth/register").send(testUser).expect(200);
        expect(response.body).toBeDefined();
        expect(response.body._id).toBeDefined();
        const createdUser = await userModel.findById(response.body._id);
        expect(createdUser).toBeTruthy();
    });

    it("Recreate existing User", async () => {
        await request.post("/auth/register").send(testUser).expect(400);
    });

    it("Add new user without body", async () => {
        await request.post("/auth/register").expect(400);
    });

    it("Add new user without some fields", async () => {
        await request.post("/auth/register").send(badTestUser).expect(400);
    });
})

describe("Login", () => {
    it("Login User", async () => {
        const response = await request.post("/auth/login").send(testUser).expect(200);
        expect(response.body).toBeDefined();
        accessToken = response.body.accessToken;
        refreshToken = response.body.refreshToken;
        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();
        const user = await verifyRefreshToken(refreshToken);
        expect(user).toBeDefined();
    });

    it("Login User without credentials", async () => {
        await request.post("/auth/login").expect(400);
    });

    it("Login User with bad credentials", async () => {
        await request.post("/auth/login").send(badTestUser).expect(400);
    });
})

describe("Token Access", () => {
    it("Authorized Access", async () => {
        await request.get("/post").set({authorization: `JWT ${accessToken}`}).expect(200);
    });
    it("Unauthorized Access", async () => {
        await request.get("/post").expect(401);
    });
    it("Bad Token", async () => {
        await request.get("/post").set({authorization: `JWT randomstringvalue123`}).expect(403);
    });
})

describe("Token expirey and rotation", () => {
    jest.setTimeout(120000);
    it("Timeout Access", async () => {
        await new Promise(r => setTimeout(r, 61*1000)); // Decrease the `JWT_TOKEN_EXPIRATION` env var to 1m for testing.
        await request.get("/post").set({authorization: `JWT ${accessToken}`}).expect(403);
    });
    it("Refresh Token without Auth", async () => {
        await request.post("/auth/refreshToken").expect(401); 
    });

    it("Refresh Token", async () => {
        const response = await request.post("/auth/refreshToken").set({authorization: `JWT ${refreshToken}`}).expect(200);
        expect(response.body).toBeDefined();
        const oldRefreshToken = refreshToken;
        accessToken = response.body.accessToken;
        refreshToken = response.body.refreshToken;
        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();
        const user = await verifyRefreshToken(refreshToken);
        console.log(user);
        expect(user.tokens.includes(refreshToken)).toBeTruthy();
        expect(user.tokens.includes(oldRefreshToken)).toBeFalsy();
        await request.get("/post").set({authorization: `JWT ${accessToken}`}).expect(200);
    });
})

describe("Logout", () => {
    it("Logout a User", async () => {
        await request.post("/auth/logout").set({authorization: `JWT ${accessToken}`}).send({ refreshToken: refreshToken }).expect(200);
    });
    it("Logout with bad token", async () => {
    await request.post("/auth/logout").set({authorization: `JWT ${accessToken}`}).send({ refreshToken: null }).expect(401);
    });  
    it("Logout without token", async () => {
    await request.post("/auth/logout").set({authorization: `JWT ${accessToken}`}).expect(400);
    });
})