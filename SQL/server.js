// <--------------------- Server code using MySQl --------------------------------------------->

import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from 'dotenv';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

dotenv.config();

const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});


db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});


// API Endpoints
app.get('/', (req, res) => {
    res.send('Hello from the backend!');
});



const getCurrentDateTime = () => {
    let date = new Date();
    let year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0'); // padStart is used to add leading zeros
    let day = date.getDate().toString().padStart(2, '0');
    let hours = date.getHours().toString().padStart(2, '0');
    let minutes = date.getMinutes().toString().padStart(2, '0');
    let seconds = date.getSeconds().toString().padStart(2, '0');

    let dateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return dateTime;
}



app.get('/tasks', (req, res) => {
    const { userId } = req.query;
    const currentTime = getCurrentDateTime();

    // SQL query to insert overdue tasks present in due_tasks table into overdue_tasks table
    const insertOverdueTasksFromDueTasks = `
        INSERT INTO overdue_tasks (user_id, task_detail, creation_time, lastedited_time, due_time)
        SELECT user_id, task_detail, creation_time, lastedited_time, due_time
        FROM due_tasks
        WHERE user_id = ? AND due_time < ?
    `;

    // SQL query to delete overdue tasks from due_tasks table
    const deleteOverdueTasksSQL = `
        DELETE FROM due_tasks WHERE user_id = ? AND due_time < ?
    `;

    // SQL query to insert due tasks present in overdue_tasks table into due_tasks table
    const insertDueTasksSQL = `
        INSERT INTO due_tasks (user_id, task_detail, creation_time, lastedited_time, due_time)
        SELECT user_id, task_detail, creation_time, lastedited_time, due_time
        FROM overdue_tasks
        WHERE user_id = ? AND due_time > ?
    `;

    // SQL query to delete due tasks from overdue_tasks table
    const deleteDueTasksSQL = `
        DELETE FROM overdue_tasks WHERE user_id = ? AND due_time > ?
    `;


    // SQL query to select due tasks
    const selectDueTasksSQL = `
        SELECT * FROM due_tasks WHERE user_id = ?
    `;

    // SQL query to select overdue tasks
    const selectOverdueTasksSQL = `
        SELECT * FROM overdue_tasks WHERE user_id = ?
    `;

    // SQL query to select completed tasks
    const selectCompletedTasksSQL = `
        SELECT * FROM completed_tasks WHERE user_id = ?
    `;


    db.query(insertOverdueTasksFromDueTasks, [userId, currentTime], (err, result) => {
        if (err) {
            console.error('Error inserting overdue tasks from due tasks:', err);
            return res.status(500).send('Error fetching tasks');
        }
    });

    db.query(deleteOverdueTasksSQL, [userId, currentTime], (err, result) => {
        if (err) {
            console.error('Error deleting overdue tasks:', err);
            return res.status(500).send('Error fetching tasks');
        }
    });


    db.query(insertDueTasksSQL, [userId, currentTime], (err, result) => {
        if (err) {
            console.error('Error inserting overdue tasks from due tasks:', err);
            return res.status(500).send('Error fetching tasks');
        }
    });

    db.query(deleteDueTasksSQL, [userId, currentTime], (err, result) => {
        if (err) {
            console.error('Error deleting overdue tasks:', err);
            return res.status(500).send('Error fetching tasks');
        }
    });



    // Perform the first query
    db.query(selectDueTasksSQL, [userId], (err, dueTasks) => {
        if (err) {
            console.error('Error selecting due tasks:', err);
            return res.status(500).send('Error fetching tasks');
        }

        // Perform the second query inside the first query's callback
        db.query(selectOverdueTasksSQL, [userId], (err, overdueTasks) => {
            if (err) {
                console.error('Error selecting overdue tasks:', err);
                return res.status(500).send('Error fetching tasks');
            }

            db.query(selectCompletedTasksSQL, [userId], (err, completedTasks) => {
                if (err) {
                    console.error('Error selecting completed tasks:', err);
                    return res.status(500).send('Error fetching tasks');
                }
                // Combine the results and send the response
                res.json({
                    dueTasks,
                    overdueTasks,
                    completedTasks
                });
            });
        });
    });
});




// API endpoint to add a task
app.post('/tasks', (req, res) => {
    const { user_id, task_detail, creation_time, lastedited_time, due_time } = req.body;
    const sql = 'INSERT INTO due_tasks (user_id, task_detail, creation_time, lastedited_time, due_time) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [user_id, task_detail, creation_time, lastedited_time, due_time], (err, result) => {
        if (err) {
            console.error('Error adding task:', err);
            return res.status(500).send('Error adding task');
        }
        res.status(200).send('Task added successfully');
    });
});



// API endpoint to edit a task
app.put('/duetasks/:id', (req, res) => {
    const { id } = req.params;
    const { task_detail, lastedited_time, due_time } = req.body;
    const sql = 'UPDATE due_tasks SET task_detail = ?, lastedited_time = ?, due_time = ? WHERE id = ?';
    db.query(sql, [task_detail, lastedited_time, due_time, id], (err, result) => {
        if (err) {
            console.error('Error editing task:', err);
            return res.status(500).send('Error editing task');
        }
        res.status(200).send('Task edited successfully');
    });
});


app.put('/overduetasks/:id', (req, res) => {
    const { id } = req.params;
    const { task_detail, lastedited_time, due_time } = req.body;
    const sql = 'UPDATE overdue_tasks SET task_detail = ?, lastedited_time = ?, due_time = ? WHERE id = ?';
    db.query(sql, [task_detail, lastedited_time, due_time, id], (err, result) => {
        if (err) {
            console.error('Error editing task:', err);
            return res.status(500).send('Error editing task');
        }
        res.status(200).send('Task edited successfully');
    });
});



// API endpoint to delete a task
app.delete('/duetasks/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM due_tasks WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting task:', err);
            return res.status(500).send('Error deleting task');
        }
        res.status(200).send('Task deleted successfully');
    });
});


app.delete('/overduetasks/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM overdue_tasks WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting task:', err);
            return res.status(500).send('Error deleting task');
        }
        res.status(200).send('Task deleted successfully');
    });
});





app.put('/completeduetask/:id', (req, res) => {
    const { id } = req.params;

    const retrieveTaskFromDue = `
        INSERT INTO completed_tasks (user_id, task_detail, creation_time, lastedited_time, due_time)
        SELECT user_id, task_detail, creation_time, lastedited_time, due_time
        FROM due_tasks
        WHERE id = ?
    `;

    const deleteTask = 'DELETE FROM due_tasks WHERE id = ?';

    db.query(retrieveTaskFromDue, [id], (err, result) => {
        if (err) {
            console.error('Error completing task from due tasks:', err);
            return res.status(500).send('Error completing task');
        }

        db.query(deleteTask, [id], (err, result) => {
            if (err) {
                console.error('Error deleting task:', err);
                return res.status(500).send('Error deleting task from due tasks');
            }
            res.status(200).send('Task completed and deleted successfully');
        });
    });
});



app.put('/completeoverduetask/:id', (req, res) => {
    const { id } = req.params;

    const retrieveTaskFromOverDue = `
        INSERT INTO completed_tasks (user_id, task_detail, creation_time, lastedited_time, due_time)
        SELECT user_id, task_detail, creation_time, lastedited_time, due_time
        FROM overdue_tasks
        WHERE id = ?
    `;

    db.query(retrieveTaskFromOverDue, [id], (err, result) => {
        if (err) {
            console.error('Error completing task from overdue tasks:', err);
            return res.status(500).send('Error completing task');
        }

        db.query(deleteTask, [id], (err, result) => {
            if (err) {
                console.error('Error deleting task:', err);
                return res.status(500).send('Error deleting task from overdue tasks');
            }
            res.status(200).send('Task completed and deleted successfully');
        });
    });
});




// Signup Endpoint
app.post('/signup', (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    const sql = 'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
    db.query(sql, [first_name, last_name, email, password], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error creating user');
            return;
        }
        // Assuming your database generates a unique userId for each record
        const userId = result.insertId;
        res.status(201).json({ message: 'User created successfully', userId });
    });
});



// Login Endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT id FROM users WHERE email = ? AND password = ?';
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            res.status(500).send('Error logging in');
            return;
        }
        if (results.length > 0) {
            const userId = results[0].id;
            res.status(200).json({ message: 'Login successful', userId });
        } else {
            res.status(401).send('Invalid email or password');
        }
    });
});



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});