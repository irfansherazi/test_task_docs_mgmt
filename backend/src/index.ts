import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import documentRoutes from './routes/documents';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import { MAX_FILE_SIZE } from './middleware/upload';
import { ensureAdminExists } from './models/User';
import { connectDB } from './modules/database';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_FILE_SIZE }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// API routes and error handling
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Document Management API' });
});

app.get('/api/*', (req, res) => {
  res.status(404).send({ message: 'Sorry, route ' + req.path + ' does not exist' });
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../../frontend', 'dist')));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend', 'dist', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

connectDB()
  .then(async () => {
    console.log('Connected to MongoDB');

    // Create admin user
    await ensureAdminExists();

    // Start server
    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });