const express = require('express');
const product = require('../controllers/productController')
const {isAuthSeller} = require('../middlewares/authSeller');
const { isAuthUser } = require('../middlewares/authUser');
const upload = require('../middlewares/uploadImage')

const productRoutes = express.Router()

// PRODUCT ROUTES
productRoutes.get('/products', product.index) // RETURN ALL PRODUCTS
productRoutes.get('/product', product.oneProduct) // RETURN ONE PRODUCT
productRoutes.get('/products/search/:name', product.search) // SEARCH ANY PRODUCT
productRoutes.post('/product/create', upload.array('images', 3), product.create) // CREATE NEW PRODUCT
productRoutes.post('/product/edit')
productRoutes.post('/product/:id/comment/new', product.addComment) // ADD NEW ITEM IN COMMENTS LIST
productRoutes.post('/product/:id', upload.array('images'), product.update) // UPDATE PRODUCT
productRoutes.post('/rating', product.addRating)
productRoutes.delete('/product/:id/delete', product.delete) // DELETE PRODUCT

module.exports = productRoutes