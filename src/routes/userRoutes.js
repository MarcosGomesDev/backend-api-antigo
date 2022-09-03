const express = require('express');
const user = require('../controllers/userController')
const upload = require('../middlewares/uploadImage')
const {isAuthUser} = require('../middlewares/authUser')

const userRoutes = express.Router();

userRoutes.get('/', function (req, res) {
    res.status(200).send("Welcome to my API")
}) // CONSOLE RETURN TO SUCCESSFULLY CONNECT TO API

// USER ROUTES
userRoutes.get('/users', user.index) // GET ALL USERS 
userRoutes.get('/user/favorites', isAuthUser, user.allFavorites) // RETURN ALL ITEMS FROM FAVORITES LIST
userRoutes.post('/sign-up/user', user.register) // CREATE NEW USER
userRoutes.post('/sign-in/user', user.login) // LOGIN USER
userRoutes.post('/forgot-password', user.forgotPassword) // SEND LINK TO RESET PASSSWORD
userRoutes.post('/valid-token', user.verifyToken) // VERIFY IF TOKEN IS VALID OR NOT
userRoutes.post('/reset-password/', user.resetPassword) // RESET PASSWORD AND SAVE IN BD
userRoutes.post('/user/upload-profile', isAuthUser, upload.single('avatar'), user.uploadProfile) //UPLOAD IMAGE PROFILE
userRoutes.post('/user/favorites/new', user.addFavorites) // ADD ITEM IN FAVORITES LIST
userRoutes.delete('/user/favorites/delete', user.removeFavorites) // REMOVE ITEM FROM FAVORITES LIST
userRoutes.delete('/user/delete/:id', user.delete) // DELETE USER

module.exports = userRoutes;