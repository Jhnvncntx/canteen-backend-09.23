const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    lrn: { 
        type: String, 
        required: true, 
        unique: true,
        minlength: 12,
        maxlength: 12
    },
    password: { 
        type: String, 
        required: true,
        minlength: 8
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
