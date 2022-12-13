const jwt = require('jsonwebtoken')
const asyncHandler = require('./async')
const ErrorResponse = require('../utils/errorResponse.utils')
const User = require('../models/user.model')

//protect routes
exports.protect = asyncHandler(async(req,res,next)=>{
    let token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1]
    }
    else if(req.cookies.token){
        token = req.cookies.token
    }

    //check if token exists
    if(!token){
        return next(new ErrorResponse('Not authorized to access this route1',401))
    }

    try {
        //verify token
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        console.log(decoded)

        req.user = await User.findById(decoded.id)
        next()
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route2',401))
    }
})

//Grant access to specific roles
exports.authorize = (...roles)=>{
    return (req,res,next) =>{
        if(!roles.includes(req.user.role)){
            return next(new ErrorResponse('Not authorized user',401))
        }
        next()
    }
}