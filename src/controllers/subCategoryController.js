require('dotenv').config()

const moment = require('moment')
const subCategory = require('../models/subCategory')
const Category = require('../models/category')

var date = moment().format('LLL')

module.exports = {
    async index(req, res) {
        const subCategories = await subCategory.find()

        return res.status(200).json(subCategories)
    },

    async create(req, res) {
        const {user} = req
        const {name, category} = req.body

        if(!user) {
            return res.status(401).json('Invalid authorization')
        }

        if(user.admin != true) {
            return res.status(401).json('Invalid authorization, u are not administrator')
        }

        const categoryExist = await Category.findOne({name: category})

        if(!categoryExist) {
            return res.status(401).json('Category not found')
        }

        if(!name) {
            return res.status(401).json('Por favor insira a sub categoria')
        }

        const subCategoryExist = await subCategory.findOne({name: name})

        if(subCategoryExist) {
            return res.status(401).json('sub Categoria já existente!')
        }

        try {
            const result = new subCategory({
                name: name,
                createdBy: user._id,
                createdAt: date
            })

            categoryExist.sub_categories.push(result)
            await categoryExist.save()
            await result.save()

            return res.status(201).json('Sub Categoria criada com sucesso')
        } catch (error) {
            return res.status(500).json('Internal Server Error')
        }
    }
}