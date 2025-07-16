import User from '../Models/userModel.js';

// Get user information
export const getUser = async (req, res) => {
    const { userId } = req.query;

    try {
        const user = await User.findById(userId, 'first_name last_name');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (err) {
        console.error('Error getting user:', err);
        res.status(500).json({ message: 'Error getting user' });
    }
}; 