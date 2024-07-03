import mongoose from 'mongoose';

// Define the completed task schema
const completedTaskSchema = new mongoose.Schema({
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
        type: Date,
        required: true
    },
    lastedited_time: {
        type: Date,
        required: true
    },
    due_time: {
        type: Date,
        required: true
    }
}, { collection: 'completed_tasks' });

// Create and export the CompletedTask model
const CompletedTask = mongoose.model('CompletedTask', completedTaskSchema);

export default CompletedTask;