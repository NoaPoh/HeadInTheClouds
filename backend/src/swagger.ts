import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User API Documentation',
      version: '1.0.0',
      description:
        'This is the Swagger documentation for the User API endpoints.',
    },
    servers: [
      {
        url: 'http://localhost:80/api',
        description: 'localhost server',
      },
      {
        url: 'https://node08.cs.colman.ac.il/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
