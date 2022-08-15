require('dotenv').config();

const jwt = require('jsonwebtoken')
const User = require('../models/user')

exports.isAuthUser = async (req, res, next) => {
    if(req.headers && req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1]

        try {
            const decode = jwt.verify(token, process.env.SECRET)

            const user = await User.findById(decode.userId)
            if(!user) {
                return res.status(401).json('Autorização inválida!')
            }

            req.user = user
            next()
        } catch (error) {
            if(error.name === 'JsonWebTokenError') {
                return res.status(400).json('Autorização inválida!')
            }
            if(error.name === 'TokenExpiredError') {
                return res.status(400).json('Sessão expirada, por favor faça login')
            }
            return res.status(500).json('Internal Server Error')
        }

        
    } else {
        return res.status(400).json('Autorização inválida!')
    }
}