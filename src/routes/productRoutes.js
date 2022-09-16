const express = require('express');
const product = require('../controllers/productController')
const {isAuthSeller} = require('../middlewares/authSeller');
const { isAuthUser } = require('../middlewares/authUser');
const upload = require('../middlewares/uploadImage')

const productRoutes = express.Router()

// PRODUCT ROUTES
productRoutes.get('/products', product.index) // RETURN ALL PRODUCTS
productRoutes.get('/products/search/:name', product.search) // SEARCH ANY PRODUCT
productRoutes.get('/product', product.oneProduct) // RETURN ONE PRODUCT
productRoutes.post('/product/create', isAuthSeller, upload.array('images', 3), product.create) // CREATE NEW PRODUCT
// productRoutes.post('/product/:id', upload.array('images'), product.update) // UPDATE PRODUCT
productRoutes.post('/product/rating/:id', isAuthUser, product.addNewRating) // ADD NEW RATING
productRoutes.put('/product/:id/update', isAuthSeller, product.update)
productRoutes.put('/product/rating/delete/:id', isAuthUser, product.deleteRating) // DELETE PRODUCT
productRoutes.post('/product/:id/rating/:ratingId', isAuthSeller, product.replyRating)
productRoutes.put('/product/:id/rating/:ratingId', isAuthSeller, product.deleteReplyRating)
productRoutes.delete('/product/:id/delete', product.delete) // DELETE PRODUCT

module.exports = productRoutes