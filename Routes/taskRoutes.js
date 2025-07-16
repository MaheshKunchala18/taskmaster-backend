import express from 'express';
import { 
    getTasks, 
    createTask, 
    updateTask, 
    deleteTask, 
    completeTask 
} from '../Controllers/taskController.js';

const router = express.Router();

// GET /tasks
router.get('/', getTasks);

// POST /tasks
router.post('/', createTask);

// PUT /tasks/:id
router.put('/:id', updateTask);

// DELETE /tasks/:id
router.delete('/:id', deleteTask);

// PUT /tasks/:id/complete
router.put('/:id/complete', completeTask);

// Legacy endpoints for backward compatibility
router.put('/duetasks/:id', updateTask);
router.put('/overduetasks/:id', updateTask);
router.delete('/duetasks/:id', deleteTask);
router.delete('/overduetasks/:id', deleteTask);
router.put('/completeduetask/:id', completeTask);
router.put('/completeoverduetask/:id', completeTask);

export default router; 