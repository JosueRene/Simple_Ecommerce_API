const jwt = require('jsonwebtoken')
const RevokedToken = require('../models/revokedToken-model')


const userAuth = async(req, res, next) => {
    try {
        
        const token = req.cookies.AuthToken
        if(!token) {
            return res.status(401).json({message: "No Token Found!"})
        }
        // Check if Token is blacklisted ( if is in database )
        const isRevoked = await RevokedToken.findOne({ token })
        if(isRevoked) {
            return res.status(401).json({message: "Token Revoked!"})
        }
        
        const decodedToken = jwt.verify(token, process.env.PRIVATEKEY)
        if(!decodedToken || !decodedToken._id) {
            return res.status(403).json({ message: "Access Denied. Invalid User!" })
        } 

        req.user = decodedToken

        next()

    } catch (error) {
        console.error(error.message)
        return res.status(403).json({ message: "Invalid Token!" });
    }
}

module.exports = userAuth