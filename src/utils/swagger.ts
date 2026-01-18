import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API',
      version: '1.0.0',
      description: 'API Documentation',
    },
    tags: [
      {
        name: 'Users',
        description: 'User management operations',
      },
    ],
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    security: [
      {
        BearerAuth: []
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'passwordHash'],
          properties: {
            _id: {
              type: 'string',
              description: 'Auto-generated MongoDB ObjectId',
              example: '507f1f77bcf86cd799439011',
            },
            username: {
              type: 'string',
              description: 'Unique username for the user',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Unique email address for the user',
              example: 'john@example.com',
            },
            passwordHash: {
              type: 'string',
              description: 'Bcrypt hashed password',
              example: '$2b$10$...',
            },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'New email address for the user',
              example: 'newemail@example.com',
            },
            password: {
              type: 'string',
              description: 'New password (will be hashed)',
              example: 'newPassword123',
            },
          },
        },
          RegisterRequest: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: { type: "string", example: "niv" },
            email: { type: "string", example: "niv@example.com" },
            password: { type: "string", example: "strongpassword123" }
          }
        },
        LoginRequest: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: { type: "string", example: "niv" },
            password: { type: "string", example: "strongpassword123" }
          }
        },
        LogoutRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
          }
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
          }
        },
        CreatePostRequest: {
          type: "object",
          required: ["title", "content"],
          properties: {
            title: { type: "string", example: "My first post" },
            content: { type: "string", example: "This is the content of the post." }
          }
        },
        UpdatePostRequest: {
          type: "object",
          required: ["title", "content"],
          properties: {
            title: { type: "string", example: "Updated post title" },
            content: { type: "string", example: "Updated content of the post." }
          }
        },
        Post: {
          type: "object",
          properties: {
            _id: { type: "string", example: "65b7c9c8e2f0a9a1f2c9d111" },
            title: { type: "string", example: "My first post" },
            content: { type: "string", example: "This is the content of the post." },
            sender: { type: "string", example: "65b7c9c8e2f0a9a1f2c9d111" },
            createdAt: { type: "string", example: "2026-01-18T12:00:00.000Z" },
            updatedAt: { type: "string", example: "2026-01-18T12:00:00.000Z" }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
              example: 'User Not Found',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };