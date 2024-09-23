require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const User = require('./user'); // Import User model
const Order = require('./order'); // Import Order model

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'];

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden if token is invalid
            }
            req.user = user;
            next(); // Proceed to the next middleware/route handler
        });
    } else {
        res.sendStatus(401); // Unauthorized if no token
    }
};

// Routes (ensure authenticateJWT is defined before this)
app.use('/api/orders', authenticateJWT); // Protect orders route

// Register route
app.post('/api/register', async (req, res) => {
    const { lrn, password } = req.body;

    try {
        const existingUser = await User.findOne({ lrn });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ lrn, password: hashedPassword });
        await newUser.save();
        res.status(201).send('User registered');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Internal server error');
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { lrn, password } = req.body;

    try {
        const user = await User.findOne({ lrn });
        if (!user) {
            return res.status(401).send('Invalid credentials');
        }

        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ lrn: user.lrn }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Internal server error');
    }
});

// Handle POST request to /api/orders
app.post('/api/orders', async (req, res) => {
    const order = new Order(req.body);
    console.log('Order received:', order); // Log the received order
    try {
        const savedOrder = await order.save();
        res.json({ order: { orderId: savedOrder._id } });
    } catch (error) {
        console.error('Error saving order:', error); // Log the error for debugging
        res.status(500).json({ error: 'Failed to save order' });
    }
});

// Handle GET request to /api/orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find(); // Fetch all orders from the database
        res.json(orders); // Send the orders as a response
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Handle PATCH request to /api/orders/:id
app.patch('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
