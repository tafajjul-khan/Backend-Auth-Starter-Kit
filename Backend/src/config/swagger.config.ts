import swaggerJsdoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Authentication & App API",
      version: "1.0.0",
      description: "Production-ready API documentation for Frontend integration",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Local Development Server",
      },
      //  { url: "https://yourdomain.com", description: "Production Server" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token without the 'Bearer ' prefix",
        },
      },
    },
  },
  // Multi-file collection scanning array paths matching criteria
  apis: [
    "./src/routes/auth.routes.ts",
    "./src/routes/user.routes.ts",
    "./src/routes/*.ts",
    "./src/routes/**/*.ts"
  ],
};

export const swaggerDocs = swaggerJsdoc(swaggerOptions);

export const generateOpenApiJson = () => {
  try {
    const outputPath = path.resolve(process.cwd(), "openapi.json"); 
    fs.writeFileSync(outputPath, JSON.stringify(swaggerDocs, null, 2), "utf8");
    console.log(`\x1b[32m✨ Success: OpenAPI JSON file generated at: ${outputPath}\x1b[0m`);
  } catch (error) {
    console.error("\x1b[31m❌ Error creating OpenAPI file:\x1b[0m", error);
  }
};
