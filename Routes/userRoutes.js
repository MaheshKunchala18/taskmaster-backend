import express from 'express';
import { getUser } from '../Controllers/userController.js';

const router = express.Router();

// GET /user
router.get('/', getUser);

export default router; 