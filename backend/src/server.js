import express from "express"
import dotenv from "dotenv"
import cookieParser from 'cookie-parser'
import {
  connectDB
} from "./libs/db.js"
import cors from 'cors'

import authRoute from './routes/authRoute.js'
import userRoute from './routes/userRoute.js'
import {
  protectedRoute
} from './middlewares/authMiddleware.js'
import friendRoute from './routes/friendRoute.js'
import messageRoute from './routes/messageRoute.js'
import conversationRoute from './routes/conversationRoute.js'
import swaggerUI from 'swagger-ui-express';
import fs from 'fs';
import { app, server } from './socket/index.js';

dotenv.config();

const PORT = process.env.PORT || 5001

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}))

const swaggerDocument = JSON.parse(fs.readFileSync('./src/swagger.json', 'utf8'));

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// public routes
app.use('/api/auth', authRoute)

// private routes
app.use(protectedRoute);
app.use('/api/users', userRoute);
app.use('/api/friends', friendRoute);
app.use('/api/messages', messageRoute);
app.use('/api/conversations', conversationRoute);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server start and listen on PORT: ${PORT}`);
  })
})