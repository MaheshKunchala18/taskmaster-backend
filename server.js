import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from 'dotenv';

import User from './Models/userModel.js'; // Import the User model
import OverdueTask from './Models/overdueTaskModel.js'; // Import the OverDueTask model
import DueTask from './Models/dueTaskModel.js';  // Import the DueTask model
import CompletedTask from './Models/completedTaskModel.js';  // Import the CompletedTask model


const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());


dotenv.config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB...'))
    .catch((err) => console.log('Could not connect to MongoDB...', err));



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




app.get('/user', async (req, res) => {
    const { userId } = req.query;

    try {
        const user = await User.findById(userId, 'first_name last_name');  // '.. ..' -> selects only required columns
        res.json(user);
    } catch (err) {
        console.error('Error getting user name:', err);
        res.status(500).send('Error getting user name');
    }
});


app.get('/tasks', async (req, res) => {
    const { userId } = req.query;
    const currentTime = getCurrentDateTime();

    try {
        // Move overdue tasks from DueTask to OverdueTask
        const overdueTasks = await DueTask.find({ user_id: userId, due_time: { $lt: currentTime } });
        await OverdueTask.insertMany(overdueTasks);
        await DueTask.deleteMany({ user_id: userId, due_time: { $lt: currentTime } });

        // Move non-overdue tasks from OverdueTask to DueTask
        const dueTasks = await OverdueTask.find({ user_id: userId, due_time: { $gt: currentTime } });
        await DueTask.insertMany(dueTasks);
        await OverdueTask.deleteMany({ user_id: userId, due_time: { $gt: currentTime } });

        // Fetch all tasks
        const fetchedDueTasks = await DueTask.find({ user_id: userId });
        const fetchedOverdueTasks = await OverdueTask.find({ user_id: userId });
        const fetchedCompletedTasks = await CompletedTask.find({ user_id: userId });

        // Combine the results and send the response
        res.json({
            dueTasks: fetchedDueTasks,
            overdueTasks: fetchedOverdueTasks,
            completedTasks: fetchedCompletedTasks
        });
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).send('Error fetching tasks');
    }
});




// API endpoint to add a task
app.post('/tasks', async (req, res) => {
    const { user_id, task_detail, creation_time, lastedited_time, due_time } = req.body;

    try {
        // Create a new due task document
        const newTask = new DueTask({
            user_id,
            task_detail,
            creation_time,
            lastedited_time,
            due_time
        });

        // Save the task to the database
        await newTask.save();

        res.status(200).send('Task added successfully');
    } catch (err) {
        console.error('Error adding task:', err);
        res.status(500).send('Error adding task');
    }
});




app.put('/duetasks/:id', async (req, res) => {
    const { id } = req.params;
    const { task_detail, lastedited_time, due_time } = req.body;

    try {
        const updatedTask = await DueTask.findByIdAndUpdate(
            id,
            {
                task_detail,
                lastedited_time,
                due_time
            },
            { new: true } // Return the updated document
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




app.put('/overduetasks/:id', async (req, res) => {
    const { id } = req.params;
    const { task_detail, lastedited_time, due_time } = req.body;

    try {
        const updatedTask = await OverdueTask.findByIdAndUpdate(
            id,
            {
                task_detail,
                lastedited_time,
                due_time
            },
            { new: true } // Return the updated document
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




// API endpoint to delete a task
app.delete('/duetasks/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedTask = await DueTask.findByIdAndDelete(id);

        if (!deletedTask) {
            return res.status(404).send('Task not found');
        }

        res.status(200).send('Task deleted successfully');
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).send('Error deleting task');
    }
});


app.delete('/overduetasks/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedTask = await OverdueTask.findByIdAndDelete(id);

        if (!deletedTask) {
            return res.status(404).send('Task not found');
        }

        res.status(200).send('Task deleted successfully');
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).send('Error deleting task');
    }
});





app.put('/completeduetask/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Retrieve the task from due_tasks and insert it into completed_tasks
        const task = await DueTask.findById(id);

        if (!task) {
            return res.status(404).send('Task not found');
        }

        const completedTask = new CompletedTask({
            user_id: task.user_id,
            task_detail: task.task_detail,
            creation_time: task.creation_time,
            lastedited_time: task.lastedited_time,
            due_time: task.due_time
        });

        await completedTask.save();
        await DueTask.findByIdAndDelete(id);

        res.status(200).send('Task completed and deleted successfully');
    } catch (err) {
        console.error('Error completing task from due tasks:', err);
        res.status(500).send('Error completing task');
    }
});





app.put('/completeoverduetask/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Retrieve the task from overdue_tasks and insert it into completed_tasks
        const task = await OverdueTask.findById(id);

        if (!task) {
            return res.status(404).send('Task not found');
        }

        const completedTask = new CompletedTask({
            user_id: task.user_id,
            task_detail: task.task_detail,
            creation_time: task.creation_time,
            lastedited_time: task.lastedited_time,
            due_time: task.due_time
        });

        await completedTask.save();
        await OverdueTask.findByIdAndDelete(id);

        res.status(200).send('Task completed and deleted successfully');
    } catch (err) {
        console.error('Error completing task from overdue tasks:', err);
        res.status(500).send('Error completing task');
    }
});





// Signup Endpoint
app.post('/signup', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    try {
        // Create a new user document
        const newUser = new User({
            first_name,
            last_name,
            email,
            password
        });

        // Save the user to the database
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
        const user = await User.findOne({ email, password });
        if (user) {
            res.status(200).json({ message: 'Login successful', userId: user._id });
        } else {
            res.status(401).send('Invalid email or password');
        }
    } catch (err) {
        res.status(500).send('Error logging in');
    }
});



app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
