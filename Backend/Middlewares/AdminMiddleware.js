const jwt = require('jsonwebtoken')
const RevokedToken = require('../models/revokedToken-model')

const adminAuth = async(req, res, next) => {
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
        if(!decodedToken.isAdmin) {
            return res.status(403).json({message: "Access Denied. Admins Only!"})
        }

        /**  req.admin = {_id: decodedToken._id, isAdmin: decodedToken.isAdmin}  THIS CAN ALSO WORK!*/ 
        req.admin = decodedToken // Attach user data to the request object
        next();

    } catch (error) {
        console.error(error.message)
        return res.status(403).json({ message: "Invalid Token!" });
    }
}

module.exports = adminAuth