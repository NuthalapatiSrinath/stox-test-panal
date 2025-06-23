import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './infrastructure/db/connection.js';

import userRoutes from './interfaces/routes/userRoutes.js';
import ngrok from '@ngrok/ngrok'
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// DB connection
connectDB();

// Routes
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Node.js web server at 8080 is running...'));

ngrok.connect({ addr: 8080, authtoken_from_env: true }).then(listener => console.log(`Ingress established at: ${listener.url()}`));

