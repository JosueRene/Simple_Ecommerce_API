const router = require('express').Router()
const Product = require('../models/product-model')
const adminAuth = require('../Middlewares/AdminMiddleware')

router.route('/').get(adminAuth, async(req, res) => {
    const adminId = req.admin._id

    try {
        
        const products = await Product.find({adminId: adminId})
        if(!products || products.length === 0) {
            return res.status(404).json({message: "No Products Found!"})
        }

        res.status(200).json({message: "Products Retrieved!", products})

    } catch (error) {
        console.error("Error fetching products:", error.message)
        return res.status(400).json({message: "Error Occured While Retrieving Products!", error: error.message})
    }
})

router.route('/add-product').post(adminAuth, async(req, res) => {
    const { productName, productDescription, productPrice, productNumberInStock } = req.body
    const adminId = req.admin._id

    if(!productName || !productDescription || !productPrice || !productNumberInStock) {
        return res.status(400).json({message: "Missing Some Fields!"})
    }

    try{
        
        const checkProduct = await Product.findOne({ productName, adminId })
        if(checkProduct) {
            res.status(400).json({message: "Product Already Exists!"})
        }

        await new Product({ productName, productDescription, productPrice, productNumberInStock, adminId }).save()
        console.log("New Product Created!")    
        return res.status(200).json({message: "New Product Added!"})    

    } catch(error) {
        console.error(error.message)
        return res.status(400).json({message: "Failed To Add Product!", error: error.message})
    } 
})

router.route('/:id').get(adminAuth, async(req, res) => {
    const { id } = req.params
    const adminId = req.admin._id

    try {
        
        const product = await Product.findOne({_id: id, adminId})
        if(!product) {
            return res.status(400).json({message: "Product Doesn't Exist!"})
        }

        return res.status(200).json({message: "Product Found!", product})

    } catch (error) {
        console.error("Error Occured While Retrieving the Product!", error.message)
        return res.status(500).json({message: "Error Occured While Retrieving the Product!", error: error.message})
    }
})

router.route('/delete/:id').delete(adminAuth, async (req, res) => {
    const { id } = req.params
    const adminId = req.admin._id

    try {
        const deletedProduct = await Product.findByOneAndDelete({_id: id, adminId})

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found!" })
        }

        console.log("Product deleted:", deletedProduct)
        return res.status(200).json({ message: "Product successfully deleted!", product: deletedProduct })

    } catch (error) {
        console.error("Error deleting product:", error.message)
        return res.status(500).json({ message: "Failed to delete product", error: error.message })
    }
})

router.route('/update-product/:id').post(adminAuth, async(req, res) => {
    const { id } = req.params
    const { productName, productDescription, productPrice, productNumberInStock } = req.body
    const adminId = req.admin._id


    try {         

        const product = await Product.findOne({_id: id, adminId})

        if (!product) {
            // If no product is found, return a 404 status with a message
            return res.status(404).json({ message: "Product not found!" })
        }

        product.productName = productName
        product.productDescription = productDescription
        product.productPrice = productPrice
        product.productNumberInStock = productNumberInStock

        await product.save()

        console.log("Product Updated!")
        return res.status(200).json({message: "Product Updated!"})

    } catch (error) {
        console.error("Failed to Update Product!", error.message)
        return res.status(500).json({message: "Failed to Update Product!", error: error.message})
    }

})

module.exports = router