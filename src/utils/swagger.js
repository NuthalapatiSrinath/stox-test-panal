import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Stox11 APIs',
      version: '1.0.0',
      description: 'API for managing users',
    },
    servers: [
      {
        url: 'http://localhost:8080',
      },
    ],
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
