const Product = require('../models/product')
const Seller = require('../models/seller')
const User = require('../models/user')
const Category = require('../models/category')
const subCategory = require('../models/subCategory')
const cloudinary = require('../helper/cloudinaryAuth')
const moment = require('moment')

var date = moment().format('LLL')

module.exports = {
    // RETURN ALL PRODUCTS
    async index(req, res) {
        try {
            const product = await Product.find()
                .populate('category')
                .populate('subcategory')
                .populate('seller')
                
            return res.status(200).json(product)
        } catch (error) {
            return res.status(500).json('Internal Server Error')
        }
    },

    // RETURN ONE PRODUCT BY ID
    async oneProduct(req, res) {
        const {productId} = req.query
        try {
            const product = await Product.findOne({_id: productId})
                .populate('category')
                .populate('subcategory')
                .populate('seller')

            return res.status(200).json(product)
        } catch (error) {
            return res.status(500).json('Internal Server Error')
        }
    },

    // SEARCH PRODUCTS
    async search(req, res) {
        const {name, verify} = req.params
        console.log(name)
        const regex = new RegExp(name, 'i')
        try {
            const products = await Product.find({
                name: {
                    $in: regex
                },
                // location: {
                //     $near: { // esse metodo near retorna os valores próximo a aquela localização
                //         $geometry: {
                //             type: 'Point',
                //             coordinates: [longitude, latitude],
                //         },
                //         $maxDistance: distance ? distance : 10000,
                //     }
                // }
            }).populate('category')
            .populate('subcategory')
            .populate('seller')

            return res.status(200).json(products)
        } catch (error) {
            return res.status(500).json('Erro ao retornar produtos com esse filtro')
        }
    },

    // CREATE NEW PRODUCT
    async create(req, res) {
        const {seller} = req
        const {name, price, description, category, subcategory} = req.body

        if(!name) {
            return res.status(401).json('Por favor insira o nome do produto')
        }

        if(!price) {
            return res.status(401).json('Por favor insira o preço do produto')
        }

        if(description) {
            return res.status(401).json('Por favor insira a descrição do produto')
        }

        if (req.files.length > 3) {
            return res.status(401).json('Quantidade de imagens não suportada')
        }

        const categorySend = await Category.findOne({name: category})

        if(!categorySend) {
            return res.status(401).json('Categoria não existe, por favor escolha outra')
        }

        const subCategorySend = await subCategory.findOne({name: subcategory})

        if(!subCategorySend) {
            return res.status(401).json('Sub Categoria não existe, por favor escolha outra')
        }

        try {
            const images = []
            const publicImages = []

            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i]

                const result = await cloudinary.uploader.upload(file.path, {
                    public_id: `${file.filename}-${Date.now()}`,
                    width: 500,
                    height: 500,
                    crop: 'fill',
                    folder: "Products Images"
                })
                images.push(result.secure_url)
                publicImages.push(result.public_id)
            }

            const product = await Product.create({
                name,
                price,
                seller: seller._id,
                images,
                publicImages,
                category: categorySend,
                subcategory: subCategorySend,
                createdAt: date
            })

            const seller = await Seller.findOne({_id: seller._id})

        
            seller.products.push(product)
            await seller.save()
            await product.save()
            return res.status(201).json('Produto criado com sucesso!')
        } catch (error) {
            return res.status(500).json('Internal Server Error')
        }
    },

    //UPDATE PRODUCT
    async update(req, res) {
        const _id = req.query
        const {name, price, description} = req.body
    },

    // REMOVE PRODUCT FROM DB AND PRODUCTS LIST FROM SELLER
    async delete(req, res) {
        const {id} = req.params

        try {
            const prod = await Product.findById({_id: id})
            for (let index = 0; index < prod.publicImages.length; index++) {
                const file = prod.publicImages[index]
    
                await cloudinary.uploader.destroy(file)
            }
            await Product.findByIdAndDelete({_id: id})
            await Seller.findOneAndUpdate({products: id},
                {
                    $pull: {
                        products: id
                    }
                }
            )

            await User.findOneAndUpdate({favorites: id},
                {
                    $pull: {
                        favorites: id
                    }
                }
            )

            return res.status(200).json('Produto deletado com sucesso')
        } catch (error) {
            console.log(error)
            return res.status(500).json('Erro ao deletar o produto')
        }
    },

    // ADD NEW COMMENT ON COMMENTS LIST
    async addComment(req, res) {
        const {id} = req.params
        const {name, comment} = req.body

        try {
            const comments = []
            comments.push({name: name, comment: comment})
            await Product.findOneAndUpdate({_id: id}, {
                $push: {
                    comments,
                },
                updatedAt: date
            })

            return res.status(201).json('Comentário inserido com sucesso!')

        } catch (error) {
            return res.status(500).json('Erro ao inserir o comentário.')
        }
    },

    async addRating(req, res) {
        const sa = [
            {
                comment: 'afhaifhseigg',
                rating: 2
            },
            {
                comment: 'afhaifhseigg',
                rating: 4
            },
            {
                comment: 'afhaifhseigg',
                rating: 1
            },
            {
                comment: 'afhaifhseigg',
                rating: 5
            },
            {
                comment: 'afhaifhseigg',
                rating: 4
            },
            {
                rating: 3
            },
        ]

        let sum = 0

        for(let i =0; i < sa.length; i++) {
            sum+=sa[i]['rating']
        }

        const result = sum / sa.length
        
        return res.status(200).json(Math.round(result))
    }
}