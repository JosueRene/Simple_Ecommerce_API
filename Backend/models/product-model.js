const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        unique: true
    },
    productDescription: {
        type: String, 
        required: true
    },
    productPrice: {
        type: Number,
        required: true
    },
    productNumberInStock: {
        type: Number,
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }

}, {timestamps: true})

const Product = mongoose.model('Product', productSchema)

module.exports = Product