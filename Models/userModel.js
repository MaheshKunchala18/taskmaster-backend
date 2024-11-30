import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        maxlength: 50,
        trim: true // Removes whitespace from both ends
    },
    last_name: {
        type: String,
        required: true,
        maxlength: 50,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        maxlength: 100,
        trim: true,
        lowercase: true // Ensures emails are stored in lowercase
    },
    password: {
        type: String,
        required: true
    }
}, { collection: 'users' });


const User = mongoose.model('User', userSchema);

export default User;