// <--------------------- Optimized Server code using MySQL --------------------------------------------->

import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

dotenv.config();

// Create connection pool for better performance
const db = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promisify database operations for async/await
const promiseDb = db.promise();

// Test connection and create optimized indexes
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
    
    // Create optimized indexes for performance
    const createIndexQueries = [
        'CREATE INDEX IF NOT EXISTS idx_user_status_due ON tasks (user_id, status, due_time)',
        'CREATE INDEX IF NOT EXISTS idx_user_id ON tasks (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_due_time ON tasks (due_time)',
        'CREATE INDEX IF NOT EXISTS idx_status ON tasks (status)'
    ];
    
    createIndexQueries.forEach(query => {
        connection.query(query, (err) => {
            if (err) console.log('Index creation warning:', err.message);
        });
    });
    
    connection.release();
});

// Utility function to get current date/time
const getCurrentDateTime = () => {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

// Utility function to categorize tasks
const categorizeTasks = (tasks) => {
    const currentTime = new Date();
    const categorized = {
        dueTasks: [],
        overdueTasks: [],
        completedTasks: []
    };
    
    tasks.forEach(task => {
        if (task.status === 'completed') {
            categorized.completedTasks.push(task);
        } else if (new Date(task.due_time) < currentTime) {
            categorized.overdueTasks.push(task);
        } else {
            categorized.dueTasks.push(task);
        }
    });
    
    return categorized;
};

// API Endpoints
app.get('/', (req, res) => {
    res.send('Hello from the optimized backend!');
});

app.get('/user', async (req, res) => {
    const { userId } = req.query;

    try {
        const [rows] = await promiseDb.execute(
            'SELECT first_name, last_name FROM users WHERE id = ?',
            [userId]
        );
        
        if (rows.length === 0) {
            return res.status(404).send('User not found');
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error getting user:', err);
        res.status(500).send('Error getting user');
    }
});

// OPTIMIZED: Single efficient query instead of 6+ operations
app.get('/tasks', async (req, res) => {
    const { userId } = req.query;

    try {
        // Single optimized query with proper indexing
        const [rows] = await promiseDb.execute(
            'SELECT * FROM tasks WHERE user_id = ? ORDER BY due_time ASC, creation_time DESC',
            [userId]
        );
        
        // Categorize tasks using JavaScript logic
        const categorizedTasks = categorizeTasks(rows);
        
        res.json(categorizedTasks);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).send('Error fetching tasks');
    }
});

// OPTIMIZED: Create task with unified table
app.post('/tasks', async (req, res) => {
    const { user_id, task_detail, due_time } = req.body;
    const currentTime = getCurrentDateTime();
    
    try {
        const [result] = await promiseDb.execute(
            'INSERT INTO tasks (user_id, task_detail, creation_time, lastedited_time, due_time, status) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, task_detail.trim(), currentTime, currentTime, due_time, 'pending']
        );
        
        res.status(200).send('Task added successfully');
    } catch (err) {
        console.error('Error adding task:', err);
        res.status(500).send('Error adding task');
    }
});

// OPTIMIZED: Edit task with unified table
app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { task_detail, due_time } = req.body;
    const currentTime = getCurrentDateTime();
    
    try {
        const [result] = await promiseDb.execute(
            'UPDATE tasks SET task_detail = ?, lastedited_time = ?, due_time = ? WHERE id = ?',
            [task_detail.trim(), currentTime, due_time, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).send('Task not found');
        }
        
        res.status(200).send('Task edited successfully');
    } catch (err) {
        console.error('Error editing task:', err);
        res.status(500).send('Error editing task');
    }
});

// OPTIMIZED: Delete task with unified table
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await promiseDb.execute(
            'DELETE FROM tasks WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).send('Task not found');
        }
        
        res.status(200).send('Task deleted successfully');
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).send('Error deleting task');
    }
});

// OPTIMIZED: Complete task with unified table
app.put('/tasks/:id/complete', async (req, res) => {
    const { id } = req.params;
    const currentTime = getCurrentDateTime();
    
    try {
        const [result] = await promiseDb.execute(
            'UPDATE tasks SET status = ?, completion_time = ?, lastedited_time = ? WHERE id = ?',
            ['completed', currentTime, currentTime, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).send('Task not found');
        }
        
        res.status(200).send('Task completed successfully');
    } catch (err) {
        console.error('Error completing task:', err);
        res.status(500).send('Error completing task');
    }
});

// LEGACY ENDPOINTS - Maintain backward compatibility with frontend
app.put('/duetasks/:id', (req, res) => {
    req.url = `/tasks/${req.params.id}`;
    req.method = 'PUT';
    app._router.handle(req, res);
});

app.put('/overduetasks/:id', (req, res) => {
    req.url = `/tasks/${req.params.id}`;
    req.method = 'PUT';
    app._router.handle(req, res);
});

app.delete('/duetasks/:id', (req, res) => {
    req.url = `/tasks/${req.params.id}`;
    req.method = 'DELETE';
    app._router.handle(req, res);
});

app.delete('/overduetasks/:id', (req, res) => {
    req.url = `/tasks/${req.params.id}`;
    req.method = 'DELETE';
    app._router.handle(req, res);
});

app.put('/completeduetask/:id', (req, res) => {
    req.url = `/tasks/${req.params.id}/complete`;
    req.method = 'PUT';
    app._router.handle(req, res);
});

app.put('/completeoverduetask/:id', (req, res) => {
    req.url = `/tasks/${req.params.id}/complete`;
    req.method = 'PUT';
    app._router.handle(req, res);
});

// Signup Endpoint
app.post('/signup', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    
    try {
        // Check if email already exists
        const [existingUsers] = await promiseDb.execute(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase().trim()]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const [result] = await promiseDb.execute(
            'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
            [first_name.trim(), last_name.trim(), email.toLowerCase().trim(), hashedPassword]
        );
        
        const userId = result.insertId;
        res.status(201).json({ message: 'User created successfully', userId });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).send('Error creating user');
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const [rows] = await promiseDb.execute(
            'SELECT id, password FROM users WHERE email = ?',
            [email.toLowerCase().trim()]
        );
        
        if (rows.length === 0) {
            return res.status(401).send('Invalid email');
        }
        
        const user = rows[0];
        
        // Compare the entered password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send('Invalid password');
        }
        
        res.status(200).json({ message: 'Login successful', userId: user.id });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).send('Error logging in');
    }
});

app.listen(port, () => {
    console.log(`Optimized server is running on http://localhost:${port}`);
});