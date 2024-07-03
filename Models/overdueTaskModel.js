import mongoose from 'mongoose';

// Define the overdue task schema
const overdueTaskSchema = new mongoose.Schema({
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
}, { collection: 'overdue_tasks' });

// Create and export the OverdueTask model
const OverdueTask = mongoose.model('OverdueTask', overdueTaskSchema);

export default OverdueTask;