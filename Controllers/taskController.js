import Task from '../Models/taskModel.js';

// Get all tasks for a user (categorized)
export const getTasks = async (req, res) => {
    const { userId } = req.query;

    try {
        const categorizedTasks = await Task.getCategorizedTasks(userId);
        res.json(categorizedTasks);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
};

// Create a new task
export const createTask = async (req, res) => {
    const { user_id, task_detail, due_time } = req.body;

    try {
        const currentTime = new Date();
        
        const newTask = new Task({
            user_id,
            task_detail: task_detail.trim(),
            creation_time: currentTime,
            lastedited_time: currentTime,
            due_time: new Date(due_time),
            status: 'pending'
        });

        await newTask.save();
        res.status(200).json({ message: 'Task added successfully' });
    } catch (err) {
        console.error('Error adding task:', err);
        res.status(500).json({ message: 'Error adding task' });
    }
};

// Update a task
export const updateTask = async (req, res) => {
    const { id } = req.params;
    const { task_detail, due_time } = req.body;

    try {
        const currentTime = new Date();
        
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
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task updated successfully' });
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ message: 'Error updating task' });
    }
};

// Delete a task
export const deleteTask = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedTask = await Task.findByIdAndDelete(id);

        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ message: 'Error deleting task' });
    }
};

// Complete a task
export const completeTask = async (req, res) => {
    const { id } = req.params;

    try {
        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await task.markCompleted();

        res.status(200).json({ message: 'Task completed successfully' });
    } catch (err) {
        console.error('Error completing task:', err);
        res.status(500).json({ message: 'Error completing task' });
    }
}; 