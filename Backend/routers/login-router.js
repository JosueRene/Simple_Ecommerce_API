const router = require('express').Router()
const { User } = require('../models/signup-model')
const RevokedToken = require('../models/revokedToken-model')
const bcrypt = require('bcrypt')
const joi = require('joi')
const jwt = require('jsonwebtoken')

const rateLimiter = require('express-rate-limit')

const loginLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too Many Attempts. Try Later!"
}) 

router.route('/login').post(loginLimiter, async(req, res) => {
    try{

        const { error } = validate(req.body)
        if(error) {
            console.error("Validation Error:", error.details[0].message);
            return res.status(400).json({message: error.details[0].message})
        }

        const user = await User.findOne({email: req.body.email})
        if(!user) {
            return res.status(400).json({message: "Invalid Email!"})
        }

        const comparepassword = await bcrypt.compare(req.body.password, user.password)
        if(!comparepassword) {
            return res.status(400).json({message: "Incorrect Password!"})
        }

        // Generate Token
        const token = user.generateAuthToken()

        // set HTTP-Only Cookie
        res.cookie('AuthToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        })

        const redirectUrl = user.isAdmin ? "/e-commerce/admin-dashboard/" : "/e-commerce/user-dashboard";

        res.status(200).json({data: token, message: "User LoggedIn!", redirectUrl: redirectUrl})

    } catch(error) {
        console.error(error)
        return res.status(500).json({message: "Internal Server Error!", error: error.message})
    }
})

const validate = (data) => {
    const schema = joi.object({
        email: joi.string().email().required().label("Email"),
        password: joi.string().required().label("Password")
    })
    
    return schema.validate(data)
}


router.route('/logout').post(async(req, res) => {
    try {
        
        console.log(req.cookies)

        const token = req.cookies.AuthToken

        if(!token) {
            return res.status(400).json({message: "No Token Found!"})
        }

        const jwtSecret = process.env.PRIVATEKEY
        const decodedToken = jwt.verify(token, jwtSecret) // Verify whether the extracted Token have been signed by our secret or private key

        const expiresAt = new Date(decodedToken.exp * 1000)

        await new RevokedToken({ token, expiresAt }).save()

        res.clearCookie('AuthToken')
        return res.status(200).json({message: "User Logged Out!"})


    } catch (error) {
        console.error(error)
        return res.status(400).json({message: "Error Occured!", error: error.message})
    }
})

module.exports = router