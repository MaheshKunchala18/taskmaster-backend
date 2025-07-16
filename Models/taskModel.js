import mongoose from 'mongoose';

// Unified task schema that replaces dueTaskModel, overdueTaskModel, and completedTaskModel
const taskSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Index for faster user-based queries
    },
    task_detail: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    creation_time: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastedited_time: {
        type: Date,
        required: true,
        default: Date.now
    },
    due_time: {
        type: Date,
        required: true,
        index: true // Index for faster date-based queries
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending',
        index: true // Index for faster status-based queries
    },
    completion_time: {
        type: Date,
        default: null
    }
}, { 
    collection: 'tasks',
    timestamps: false // We're managing our own timestamps
});

// Compound index for optimal query performance
taskSchema.index({ user_id: 1, status: 1, due_time: 1 });

// Virtual field to calculate if task is overdue
taskSchema.virtual('isOverdue').get(function() {
    if (this.status === 'completed') return false;
    return new Date() > this.due_time;
});

// Virtual field to get categorized status
taskSchema.virtual('categoryStatus').get(function() {
    if (this.status === 'completed') return 'completed';
    return this.isOverdue ? 'overdue' : 'due';
});

// Ensure virtual fields are serialized
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

// Instance method to mark task as completed
taskSchema.methods.markCompleted = function() {
    this.status = 'completed';
    this.completion_time = new Date();
    this.lastedited_time = new Date();
    return this.save();
};

// Static method to get categorized tasks for a user
taskSchema.statics.getCategorizedTasks = function(userId) {
    return this.find({ user_id: userId })
        .sort({ due_time: 1, creation_time: -1 })
        .then(tasks => {
            const categorized = {
                dueTasks: [],
                overdueTasks: [],
                completedTasks: []
            };
            
            tasks.forEach(task => {
                const taskObj = task.toObject({ virtuals: true });
                switch (taskObj.categoryStatus) {
                    case 'completed':
                        categorized.completedTasks.push(taskObj);
                        break;
                    case 'overdue':
                        categorized.overdueTasks.push(taskObj);
                        break;
                    case 'due':
                        categorized.dueTasks.push(taskObj);
                        break;
                }
            });
            
            return categorized;
        });
};

// Create and export the unified Task model
const Task = mongoose.model('Task', taskSchema);

export default Task; 