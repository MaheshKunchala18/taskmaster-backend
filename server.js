import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './Routes/authRoutes.js';
import taskRoutes from './Routes/taskRoutes.js';
import userRoutes from './Routes/userRoutes.js';

// Import Models to ensure indexes are created
import Task from './Models/taskModel.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Load environment variables
dotenv.config();

// MongoDB Connection
const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(() => {
        console.log('✅ Connected to MongoDB...');
        // Ensure indexes are created for optimal performance
        Task.createIndexes().then(() => {
            console.log('✅ Database indexes created successfully');
        }).catch(err => {
            console.log('⚠️ Warning: Error creating indexes:', err.message);
        });
    })
    .catch((err) => console.log('❌ Could not connect to MongoDB...', err));

// Routes
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/user', userRoutes);

// Legacy routes for backward compatibility
app.use('/', authRoutes);  // For direct /signup and /login
app.use('/', taskRoutes);  // For direct task routes
app.use('/', userRoutes);  // For direct user routes

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'TaskMaster API is running!',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        path: req.originalUrl
    });
});

app.listen(port, () => {
    console.log(`🚀 TaskMaster server is running on port: ${port}`);
});
