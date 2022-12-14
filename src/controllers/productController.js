const Product = require('../models/product')
const Seller = require('../models/seller')
const User = require('../models/user')
const Category = require('../models/category')
const subCategory = require('../models/subCategory')
const cloudinary = require('../helper/cloudinaryAuth')
const moment = require('moment')
const {getDistanceinKm} = require('../utils/getDistance')
const {sumOfArray, averageOfArray} = require('../utils/AverageFunction')

var date = moment().format('LLL')

module.exports = {
    // RETURN ALL PRODUCTS
    async index(req, res) {
        try {
            const product = await Product.find()
                .populate('category')
                .populate('subcategory')
                .populate('seller')
                .populate('rating.userId')
                
            return res.status(200).json(product)
        } catch (error) {
            console.log(error)
            return res.status(500).json('Internal Server Error')
        }
    },

    // RETURN ONE PRODUCT BY ID
    async oneProduct(req, res) {
        const {id} = req.params
        try {
            const product = await Product.findOne({_id: id})
                .populate('category')
                .populate('subcategory')
                .populate('seller')
                .populate('rating.userId')

            return res.status(200).json(product)
        } catch (error) {
            console.log(error)
            return res.status(500).json('Internal Server Error')
        }
    },

    // SEARCH PRODUCTS
    async search(req, res) {    
        const {name} = req.params
        const {longitude, latitude, userDistance} = req.body
        const maxDistance = userDistance ? userDistance : 5
        const regex = new RegExp(name, 'i')
        try {
            const products = await Product.find({
                name: {
                    $in: regex
                },
            })
            .populate('category')
            .populate('subcategory')
            .populate('seller')
            .populate('rating.userId')

            // productsDistances = []

            // products.map((product) => {
            //     let distance = getDistanceinKm(latitude, longitude, product.seller.location.coordinates[1], product.seller.location.coordinates[0])
            //     if(parseInt(distance) <= maxDistance) {
            //         productsDistances.push({product, distance: parseFloat(distance)})
            //     }
            // })
    
            // productsDistances.sort((sellerA, sellerB) => {
            //     if (sellerA.distance > sellerB.distance) {
            //         return 1;
            //     }
            //     if (sellerA.distance < sellerB.distance) {
            //         return -1;
            //     }

            //     return 0;
            // })

            return res.json(products)
        } catch (error) {
            console.log(error)
            return res.status(500).json('Erro ao retornar produtos com esse filtro')
        }
    },

    // CREATE NEW PRODUCT
    async create(req, res) {
        const {sellerAuth} = req

        const {name, price, description, category, subcategory} = req.body

        if(!name) {
            return res.status(401).json('Por favor insira o nome do produto')
        }

        if(!price) {
            return res.status(401).json('Por favor insira o pre??o do produto')
        }

        if(!description) {
            return res.status(401).json('Por favor insira a descri????o do produto')
        }

        // if (req.files.length > 3) {
        //     return res.status(401).json('Quantidade de imagens n??o suportada')
        // }

        const categorySend = await Category.findOne({name: category})

        if(!categorySend) {
            return res.status(401).json('Categoria n??o existe, por favor escolha outra')
        }

        const subCategorySend = await subCategory.findOne({name: subcategory})

        if(!subCategorySend) {
            return res.status(401).json('Sub Categoria n??o existe, por favor escolha outra')
        }

        try {
            // const images = []
            // const publicImages = []

            // for (let i = 0; i < req.files.length; i++) {
            //     const file = req.files[i]

            //     const result = await cloudinary.uploader.upload(file.path, {
            //         public_id: `${file.filename}-${Date.now()}`,
            //         width: 500,
            //         height: 500,
            //         crop: 'fill',
            //         folder: "Products Images"
            //     })
            //     images.push(result.secure_url)
            //     publicImages.push(result.public_id)
            // }

            const product = await Product.create({
                name,
                price,
                description,
                seller: sellerAuth._id,
                // images,
                // publicImages,
                category: categorySend,
                subcategory: subCategorySend,
                createdAt: date
            })

            const seller = await Seller.findOne({_id: sellerAuth._id})

            seller.products.push(product)
            await seller.save()
            await product.save()

            return res.status(201).json('Produto criado com sucesso!')
        } catch (error) {
            console.log(error)
            return res.status(500).json('Internal Server Error')
        }
    },

    //UPDATE PRODUCT
    async update(req, res) {
        const {sellerAuth} = req
        const {id} = req.params
        const {name, price, description, category, subcategory} = req.body

        if(!id) {
            return res.status(400).json('Produto n??o existe!')
        }

        if(!name) {
            return res.status(400).json('O nome n??o pode ser vazio!')
        }

        if(!price) {
            return res.status(400).json('O pre??o n??o pode ser vazio!')
        }

        if(!description) {
            return res.status(400).json('A descri????o n??o pode ser vazia!')
        }

        try {
            const categorySend = await Category.findOne({name: category})

            if(!categorySend) {
                return res.status(401).json('Categoria n??o existe, por favor escolha outra')
            }
    
            const subCategorySend = await subCategory.findOne({name: subcategory})
    
            if(!subCategorySend) {
                return res.status(401).json('Sub Categoria n??o existe, por favor escolha outra')
            }

            const product = await Product.findById(id)
            .populate('seller')
            .populate('category')
            .populate('subcategory')


            if(!product) {
                return res.status(400).json('Este produto n??o existe!')
            }

            if(req.files.length > 0){
                const newImages = []
                const newPublicImages = []

                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i]

                    const result = await cloudinary.uploader.upload(file.path, {
                        public_id: `${file.filename}-${Date.now()}`,
                        width: 500,
                        height: 500,
                        crop: 'fill',
                        folder: "Products Images"
                    })
                    newImages.push(result.secure_url)
                    newPublicImages.push(result.public_id)
                }
            }

            await product.updateOne({
                $set: {
                    name: name !== product.name ? name : product.name,
                    price: price !== product.price ? price : product.price,
                    category: categorySend !== product.category ? categorySend : product.category,
                    subcategory: subCategorySend !== product.subcategory ? subCategorySend : product.subcategory,
                    images: req.files.length > 0 ? newImages : product.images,
                    publicImages: req.files.length > 0 ? newPublicImages : product.publicImages,
                    updatedAt: date
                }
            })

            return res.status(201).json('Produto atualizado com sucesso!')
        } catch (error) {
            console.log(error)
            return res.status(500).json('Internal Server Error')
        }
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

    // ADD RATING ON PRODUCT
    async addNewRating(req, res) {
        const {userAuth} = req; // o user j?? vai pra requisi????o pelo "isAuth" chamado na rota
        const {id} = req.params;//id do produto a ser avaliado
        // const {rating_selected} = req.headers
        const {comment, rating_selected} = req.body

        if(!userAuth) {
            return res.status(401).json('Acesso n??o autorizado')
        }

        if(!comment) {
            return res.status(400).json('O coment??rio n??o pode ser vazio')
        }

        if(!rating_selected) {
            return res.status(400).json('Nota inv??lida')
        }

        // verify if the rating is inside the scope
        if(rating_selected > 5 || rating_selected < 1) {
            return res.status(400).json("Nota de avaliacao inv??lida")
        }

        try {

            const product = await Product.findById(id)
            .populate('seller')
            .populate('category')
            .populate('subcategory')

            
            if(product.rating.length >= 1) { // checking if we have 1 or more ratings
                // search for the previous rating of the user for this product
                const userRatingIdentifier = userAuth._id; // .toString() -> if necessary - retorna um tipo Object

                const previousUserRating = await Product.find({_id: id},
                    {rating: { $elemMatch: { userId: userRatingIdentifier } }})
                    // console.log(previousUserRating) // to be tested

                // check if the user has at least 1 rating among product's rating
                if(previousUserRating[0].rating[0] === undefined) { // if he doesn't

                    // creating a new rating
                    console.log('Criando uma nova avalia????o para o usu??rio')
                    await product.updateOne({$push: {
                        rating: [{
                            userName: userAuth.name,
                            userId: userAuth._id,
                            productRating: rating_selected,
                            productReview: comment
                        }]
                    }});

                    // add the new rate value to the array of rates
                    await product.updateOne({$push: {
                        ratingNumbers: rating_selected
                    }});

                } else {
                    // if the user already has a rating for the product
                    const previousUserRatingValue = previousUserRating[0].rating[0].productRating;
                    
                    // update the old rating of the user 
                    await Product.updateMany({"rating.userId": userRatingIdentifier},
                    {$set: {
                        "rating.$[element].userName": userAuth.name,
                        "rating.$[element].userId": userAuth._id,
                        "rating.$[element].productRating": rating_selected,
                        "rating.$[element].productReview": comment

                    }},
                    {arrayFilters: [{"element.userId": userRatingIdentifier}]}
                    );

                    // replace the old value of rating by the new one, inside the array of ratings
                    await Product.updateOne({_id: id, ratingNumbers: previousUserRatingValue}, 
                        {$set: {"ratingNumbers.$": rating_selected}}
                        )
                };
                
            } else if(product.rating.length < 1) {
                // create the first rating for the product
                console.log('Nenhuma avalia????o existente para este produto, criando uma nova')
                // console.log(user)
                // console.log("#####################################################################")
                // console.log(product)
                await product.updateOne({$push: {
                    rating: {
                        userName: userAuth.name,
                        userId: userAuth._id,
                        productRating: rating_selected,
                        productReview: comment
                    },
                }});

                await product.updateOne({$push: {
                    ratingNumbers: rating_selected
                }})
            }

            product.save()
        } catch (error) {
            return res.status(500).json('Internal Server Error')
        }

        try { // Calcs
            // totally updated product, used to do the average calcs
            const productUpdated = await Product.findById(id)
            .populate('seller')
            .populate('category')
            .populate('subcategory')

            await productUpdated.updateOne({
                $set: { 
                    ratingSum: sumOfArray(productUpdated.ratingNumbers),
                    ratingAverage: averageOfArray(productUpdated.ratingNumbers)
                } },
                {new: true},
            );

            productUpdated.save()
        } catch (error) {
            return res.status(500).json('Internal server error')
        }
        


        return res.status(201).json('Avalia????o inserida com sucesso!')
    },

    // DELETE RATING ON PRODUCT
    async deleteRating(req, res) {
        const {userAuth} = req; // o user j?? vai pra requisi????o pelo "isAuth" chamado na rota
        const {id} = req.params;//id do produto a ser avaliado

        try {
            const product = await Product.findById(id)
            .populate('seller')
            .populate('category')
            .populate('subcategory')

            let productDelete = await Product.findOne({_id: id})

            let oldRating = productDelete.rating

            const result = oldRating.find(i => i.userId.toString() === userAuth._id.toString())

            await product.updateOne(
                {$pull: {
                    rating: {
                        userId: userAuth._id
                    },
                    ratingNumbers: result.productRating
                },
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json('Internal Server Error')
        }
        
        try { // Calcs
            // totally updated product, used to do the average calcs
            const productUpdated = await Product.findById(id)
            .populate('seller')
            .populate('category')
            .populate('subcategory')

            if(productUpdated.ratingNumbers.length === 0) {
                await productUpdated.updateOne({
                    $set: { 
                        ratingSum: 0,
                        ratingAverage: 0
                    } },
                    {new: true},
                );
            } else {
                await productUpdated.updateOne({
                    $set: { 
                        ratingSum: sumOfArray(productUpdated.ratingNumbers),
                        ratingAverage: averageOfArray(productUpdated.ratingNumbers)
                    } },
                    {new: true},
                );
            }

            productUpdated.save()
        } catch (error) {
            return res.status(500).json('Internal server error')
        }

        return res.status(200).json('Avalia????o exclu??da com sucesso!')
    },

    async replyRating(req, res) {
        const {sellerAuth} = req
        const {ratingId} = req.params
        const {replyComment} = req.body

        try {
            await Product.updateMany({"rating._id": ratingId},
            {$set: {
                "rating.$[element].replyRating": {
                    sellerId: sellerAuth._id,
                    replyReview: replyComment
                }
            }},
            {arrayFilters: [{"element._id": ratingId}]}
            )

            return res.status(201).json('Resposta enviada com sucesso!')
        } catch (error) {
            return res.status(500).json('Internal Server Error')
        }
    },

    async deleteReplyRating(req, res) {
        const {sellerAuth} = req
        const {ratingId} = req.params

        try {
            await Product.updateMany({"rating._id": ratingId},
            {$pull: {
                "rating.$[element].replyRating": {
                    sellerId: sellerAuth._id
                }
            }},
            {arrayFilters: [{"element._id": ratingId}]}
            )

            return res.status(201).json("Resposta excluida com sucesso!")
        } catch (error) {
            console.log(error)
        }
    }
}