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
    components: {
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
        CreateUserRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
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
            password: {
              type: 'string',
              description: 'Plain text password (will be hashed)',
              example: 'securePassword123',
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
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Unique username for the user',
              example: 'johndoe',
            },
            password: {
              type: 'string',
              description: 'password',
              example: 'securePassword123',
            },
          },
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