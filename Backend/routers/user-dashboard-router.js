const router = require('express').Router()
const Product = require('../models/product-model')
const userAuth = require('../Middlewares/userMiddleware')
const Cart = require('../models/shoppingCart-model')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

router.route('/').get(userAuth, async(req, res) => {
    try{

        const products = await Product.find().select('-adminId -createdAt -updatedAt -__v')
        if(!products || products.length === 0) {
            return res.status(404).json({message: "No Products Found!"})
        }

        res.status(200).json({message: "Products Retrieved!", products})

    } catch(error) {
        console.error("Error fetching products:", error.message)
        return res.status(400).json({message: "Error Occured While Retrieving Products!", error: error.message})
    }
})


/***** Add Products in the Cart and Create a Cart if there's none! *****/

router.route('/cart/add').post(userAuth, async(req, res) => {
    const { productId, quantity } = req.body
    const userId = req.user._id

    try {
        
        const product = await Product.findById(productId)
        if(!product) {
            return res.status(400).json({message: "Product Not Found!"})
        }

        let cart = await Cart.findOne({ userId })
        if(!cart) {
            cart = new Cart({userId, items: [], totalPrice: 0})
        }

        // Check whether the product exist in Cart, and if it does, update the quantity Only!
        const productExistIndex = cart.items.findIndex( item => item.productId.toString() === productId )
        
        if(productExistIndex > -1) {
            cart.items[productExistIndex].quantity += quantity
        } else {
            cart.items.push({ productId, quantity })
        }

        const productsInCart = await Product.find({_id: { $in: cart.items.map( item => item.productId )}})
        
        cart.totalPrice = cart.items.reduce((total, item) => {
            const productData = productsInCart.find(p => p._id.toString() === item.productId.toString())
            return total + (productData ? productData.productPrice * item.quantity : 0)
        }, 0)

        await cart.save()
        return res.status(201).json({ message: "Product added to cart!", cart });

    } catch (error) {
        console.error("Error Occured While Adding Product to Cart:", error.message)
        return res.status(500).json({message: "Failed to add item to cart!", error: error.message})
    }
})


/***** View All Products in the Cart  *****/

router.route('/cart/view').get(userAuth, async(req, res) => {
    const userId = req.user._id

    try {
        
        const cart = await Cart.findOne({ userId }).populate('items.productId', 'productName productPrice')
        if(!cart || cart.length === 0) {
            return res.status(400).json({message: "Your Cart is Empty!"})
        }

        return res.status(200).json({message: "Here's Your Cart!", cart})

    } catch (error) {
        console.error("Failed to fetch cart!", error.message)
        return res.status(500).json({ message: "Failed to fetch cart!", error: error.message })
    }
})



/***** Delete Product From The Cart *****/

router.route('/cart/delete/:productId').delete(userAuth, async(req, res) => {
    const { productId } = req.params
    const userId = req.user._id

    try {
        
        const cart = await Cart.findOne({ userId })
        if(!cart) {
            return res.status(404).json({message: "Cart Not Found!"})
        }

        const productsInCart = await Product.find({_id: { $in: cart.items.map(item => item.productId ) }})

        cart.items = cart.items.filter(item => item.productId.toString() !== productId)

        cart.totalPrice = cart.items.reduce((total, item) => {

            const productData = productsInCart.find(p => p._id.toString() === item.productId.toString())
            return total + (productData? productData.productPrice * item.quantity : item.totalPrice);

        }, 0)

        await cart.save()
        return res.status(200).json({message: "Product Removed from Cart!", cart})

    } catch (error) {
        console.error("Error Occured While Deleting Product From Cart!", error.message)
        return res.status(500).json({message: "Error Occured While Deleting Product From Cart!", error: error.message})
    }

})


/***** Processing Stripe Payments *****/
router.route('/cart/checkout').post(userAuth, async (req, res) => {
    const userId = req.user._id;

    try {
        // Fetch the user's cart details
        const cart = await Cart.findOne({ userId }).populate('items.productId', 'productName productPrice');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Your Cart is Empty!" });
        }

        // Prepare the line items for the Stripe checkout session
        const lineItems = cart.items.map(item => ({
            price_data: {
                currency: 'usd', // currency
                product_data: {
                    name: item.productId.productName,
                },
                unit_amount: item.productId.productPrice * 100, // Price in cents
            },
            quantity: item.quantity,
        }));

        // Create a new Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.BASE_URL}/cart/success`, // Redirect on successful payment
            cancel_url: `${process.env.BASE_URL}/`, // Redirect on dashboard after payment cancellation
        });

        // Return the session ID to the frontend
        return res.status(200).json({ sessionId: session.id });

    } catch (error) {
        console.error('Error creating Stripe session:', error.message);
        return res.status(500).json({ message: 'Failed to create checkout session', error: error.message });
    }
});


router.route('/cart/success').get(userAuth, (req, res) => {
    res.send('Payment Successful! Thank you for your purchase.');
});

module.exports = router