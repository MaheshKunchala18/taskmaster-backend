import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

import User from './Models/userModel.js'; // Import the User model
import Task from './Models/taskModel.js'; // Import the unified Task model

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

dotenv.config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(() => {
        console.log('Connected to MongoDB...');
        // Ensure indexes are created for optimal performance
        Task.createIndexes().then(() => {
            console.log('Database indexes created successfully');
        }).catch(err => {
            console.log('Error creating indexes:', err);
        });
    })
    .catch((err) => console.log('Could not connect to MongoDB...', err));

// Utility function to get current date/time
const getCurrentDateTime = () => {
    return new Date();
}

app.get('/user', async (req, res) => {
    const { userId } = req.query;

    try {
        const user = await User.findById(userId, 'first_name last_name');
        res.json(user);
    } catch (err) {
        console.error('Error getting user name:', err);
        res.status(500).send('Error getting user name');
    }
});

// OPTIMIZED: Single efficient query instead of 6+ operations
app.get('/tasks', async (req, res) => {
    const { userId } = req.query;

    try {
        // Single efficient query with proper indexing
        const categorizedTasks = await Task.getCategorizedTasks(userId);
        
        res.json(categorizedTasks);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).send('Error fetching tasks');
    }
});

// OPTIMIZED: Create task with unified model
app.post('/tasks', async (req, res) => {
    const { user_id, task_detail, due_time } = req.body;

    try {
        const currentTime = getCurrentDateTime();
        
        // Create new task with unified model
        const newTask = new Task({
            user_id,
            task_detail: task_detail.trim(),
            creation_time: currentTime,
            lastedited_time: currentTime,
            due_time: new Date(due_time),
            status: 'pending'
        });

        await newTask.save();
        res.status(200).send('Task added successfully');
    } catch (err) {
        console.error('Error adding task:', err);
        res.status(500).send('Error adding task');
    }
});

// OPTIMIZED: Edit task with unified model
app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { task_detail, due_time } = req.body;

    try {
        const currentTime = getCurrentDateTime();
        
        const updatedTask = await Task.findByIdAndUpdate(
            id,
            {
                task_detail: task_detail.trim(),
                lastedited_time: currentTime,
                due_time: new Date(due_time)
            },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).send('Task not found');
        }

        res.status(200).send('Task edited successfully');
    } catch (err) {
        console.error('Error editing task:', err);
        res.status(500).send('Error editing task');
    }
});

// OPTIMIZED: Delete task with unified model
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedTask = await Task.findByIdAndDelete(id);

        if (!deletedTask) {
            return res.status(404).send('Task not found');
        }

        res.status(200).send('Task deleted successfully');
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).send('Error deleting task');
    }
});

// OPTIMIZED: Complete task with unified model
app.put('/tasks/:id/complete', async (req, res) => {
    const { id } = req.params;

    try {
        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).send('Task not found');
        }

        // Use the model's built-in method to mark as completed
        await task.markCompleted();

        res.status(200).send('Task completed successfully');
    } catch (err) {
        console.error('Error completing task:', err);
        res.status(500).send('Error completing task');
    }
});

// LEGACY ENDPOINTS - Maintain backward compatibility with frontend
// These redirect to the new unified endpoints
app.put('/duetasks/:id', (req, res) => {
    req.url = `/tasks/${req.params.id}`;
    app._router.handle(req, res);
});

app.put('/overduetasks/:id', (req, res) => {
    req.url = `/tasks/${req.params.id}`;
    app._router.handle(req, res);
});

app.delete('/duetasks/:id', (req, res) => {
    req.url = `/tasks/${req.params.id}`;
    app._router.handle(req, res);
});

app.delete('/overduetasks/:id', (req, res) => {
    req.url = `/tasks/${req.params.id}`;
    app._router.handle(req, res);
});

app.put('/completeduetask/:id', (req, res) => {
    req.url = `/tasks/${req.params.id}/complete`;
    app._router.handle(req, res);
});

app.put('/completeoverduetask/:id', (req, res) => {
    req.url = `/tasks/${req.params.id}/complete`;
    app._router.handle(req, res);
});

// Signup Endpoint
app.post('/signup', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    try {
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save user with hashed password
        const newUser = new User({
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
        });

        const savedUser = await newUser.save();

        // Send the userId as a response
        res.status(201).json({ message: 'User created successfully', userId: savedUser._id });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error creating user');
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).send('Invalid email');
        }

        // Compare the entered password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send('Invalid password');
        }

        // If the password matches, send a success response
        res.status(200).json({ message: 'Login successful', userId: user._id });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error logging in');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
