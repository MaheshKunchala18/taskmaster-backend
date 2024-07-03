import mongoose from 'mongoose';

// Define the due task schema
const dueTaskSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Reference to the User model
        required: true
    },
    task_detail: {
        type: String,
        required: true
    },
    creation_time: {
        type: String,
        required: true
    },
    lastedited_time: {
        type: String,
        required: true
    },
    due_time: {
        type: String,
        required: true
    }
}, { collection: 'due_tasks' });

// Create and export the DueTask model
const DueTask = mongoose.model('DueTask', dueTaskSchema);

export default DueTask;