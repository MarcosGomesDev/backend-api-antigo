const express = require('express');
const subCategory = require('../controllers/subCategoryController')

const subCategoryRoutes = express.Router()

// PRODUCT ROUTES
subCategoryRoutes.get('/subCategories', subCategory.index) // RETURN ALL PRODUCTS

module.exports = subCategoryRoutes