const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId: String,
    items: [{ item: String, quantity: Number }],
    status: String,
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
