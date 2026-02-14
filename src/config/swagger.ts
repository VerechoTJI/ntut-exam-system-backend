import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NTUT Exam System API",
      version: "1.0.0",
      description: "API documentation for the NTUT Exam System (Admin & User)",
    },
    servers: [
      {
        url: "http://localhost:3002",
        description: "Admin Server",
      },
      {
        url: "http://localhost:3001/api",
        description: "User Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Paths to files containing OpenAPI definitions
  apis: ["./src/routes/**/*.ts", "./src/schemas/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
