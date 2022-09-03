require('dotenv').config();

const Seller = require('../models/seller')
const Product = require('../models/product')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require("crypto")
const Token = require("../models/token");
const sendEmail = require("../utils/sendEmail")
const cloudinary = require('../helper/cloudinaryAuth')
const moment = require('moment')

var date = moment().format('LLL')

module.exports = {
    //RETURN ALL SELLERS
    async index(req, res) {

        const sellers = await Seller.find().populate('products')
        return res.json(sellers)
    },

    async seller(req, res) {
        const {sellerId} = req.query

        try {
            const seller = await Seller.findOne({_id: sellerId}).populate('products')

            return res.status(200).json(seller)
        } catch (error) {
            return res.status(500).json('Internal Server Error')
        }
    },

    async sellerProducts(req, res) {
        const {sellerId} = req.query

        try {
            const seller = await Product.find({seller: sellerId})
                .populate('seller')
                .populate('category')
                .populate('subcategory')
                
            return res.status(200).json(seller)
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    // RETURN ONLY THE LOGGED SELLER
    async logged(req, res) {
        const {seller} = req
        if(!seller) {
            return res.status(401).json('Invalid authorization')
        }

        const logged = await Seller.findOne({_id: seller._id}).populate('products')

        return res.status(200).json(logged)
    },

    //CREATE SELLER
    async register(req, res) {
        const {name, email, password, longitude, latitude} = req.body
        try {
            //Validations
            if(!name) {
                return res.status(401).json('O nome é obrigatório!')
            }

            if(!email) {
                return res.status(401).json('O email é obrigatório!')
            }

            if(!password) {
                return res.status(401).json('A senha é obrigatória!')
            }

            // VERIFIED IF SELLER EXISTS
            const sellerExist = await Seller.findOne({email: email})

            if(sellerExist) {
                return res.status(401).json('Este email já está sendo utilizado!')
            }

            // HASHING THE PASSWORD
            const salt = await bcrypt.genSalt(12)
            const passwordHash = await bcrypt.hash(password, salt)

            // METHOD OF SAVE NEW SELLER
            const seller = new Seller({
                name,
                email,
                password: passwordHash,
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                createdAt: date
            });

            // SAVE NEW SELLER
            await seller.save()

            // AFTER SAVE SHOW THIS
            return res.status(201).json('Vendedor criado com sucesso!')
        } catch (error) {
            // IF HAVE AN ERROR SHOW THIS
            return res.status(500).json('Erro ao criar usuário, tente novamente mais tarde!')
        }
    },

    // DELETE SELLER
    async delete(req, res) {
        const {seller} = req
        try {
            
            const result = await Seller.findByIdAndDelete({_id: seller._id})
            console.log(result)

            let productsID = result.products.map((p) => p._id)

            await Product.deleteMany({
                _id: {
                    $in: productsID,
                }
            })
            
            return res.status(200).json('Usuário deletado com sucesso')
        } catch (error) {
            return res.status(500).json('Erro ao deletar o usuário')
        }
    },

    // Login SELLER
    async login(req, res, next) {
        const {email, password} = req.body

        //Validations
        if(!email) {
            return res.status(401).json('O email é obrigatório!')
        }
        
        //Check if SELLER exists
        const seller = await Seller.findOne({email: email})

        if(!seller) {
            return res.status(401).json('Usuário não encontrado!')
        }

        if(!password) {
            return res.status(401).json('A senha é obrigatória!')
        }

        //Check if password match
        const checkPassword = await bcrypt.compare(password, seller.password)

        if(!checkPassword) {
            return res.status(401).json('Senha inválida!')
        }

        try {
            const secret = process.env.SECRET

            const token = jwt.sign({
                sellerId: seller._id
            }, secret, {expiresIn: '1d'})

            return res.status(200).json({seller, token})


        } catch (err) {
            return res.status(500).json('Erro ao logar usuário, tente novamente mais tarde!')
        }
    },

    //SEND LINK FOR RESET PASSWORD
    async forgotPassword(req, res) {
        const {email} = req.body

        try{
            if(!email) {
                return res.status(401).json('Por favor insira o email')
            }

            const seller = await Seller.find({email: email})
            if (!seller){
                return res.status(401).json("Nenhum usuário encontrado com este email");
            }                

            let token = await Token.findOne({ sellerId: seller._id });
            if (!token) {
                newResetToken = await new Token({
                    userId: seller._id,
                    token: crypto.randomBytes(32).toString("hex"),
                }).save();
            }

            const link = newResetToken.token;
            await sendEmail(user.email, "Redefinir senha"
                ,`Seu código de redefinição de senha é: ${link}`
            );

            return res.status(200).json("Token de redefinição de senha foi enviado ao email");
        } catch (error) {
            console.log(error);
            return res.status(500).json("Algum erro ocorreu, por favor tente novamente mais tarde");
        }
    },

    async verifyToken(req, res) {
        const {email} = req.query
        const {token} = req.body

        try {
            const seller = await Seller.findOne({email: email})
    
            if (!seller) {
                return res.status(401).json("Token inválido ou expirado!");
            }
    
            const verifyToken = await Token.findOne({
                userId: seller._id,
                token: token,
            });
    
            if (!verifyToken) {
                return res.status(401).json("Token inválido ou expirado!");
            }

            return res.status(200).json('Token verificado!')
        } catch (error) {
            return res.status(500).json("Algum erro ocorreu, tente novamente mais tarde!");
        }
    },

    //RESET AND SAVE NEW PASSWORD
    async resetPassword(req, res) {
        const {token} = req.query
        const {password} = req.body
        try {
            if(!password) {
                return res.status(401).json("Por favor insira a senha!")
            }

            const sellerToken = await Token.findOne({token: token})

            if (!sellerToken) {
                return res.status(401).json("Token inválido ou expirado!");
            }

            const salt = await bcrypt.genSalt(12)
            const passwordHash = await bcrypt.hash(password, salt)

            
            Seller.findOneAndUpdate({_id: sellerToken.userId}, {password: passwordHash, updatedAt: date}, (updateErr) => {
                if(updateErr) {
                    return res.status(401).json({msg: 'Erro ao alterar a senha'})
                } else {

                    return res.status(200).json({msg: "Senha alterada com sucesso!"});
                }
            })  
            await sellerToken   .delete();     
        } catch (error) {
            console.log(error);
            return res.status(500).json("Algum erro ocorreu, por favor tente novamente mais tarde");
        }
    },

    //UPLOAD PROFILE
    async uploadProfile(req, res) {
        const {seller} = req
        if(!seller) {
            return res.status(401).json("Acesso não autorizado")
        }

        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                public_id: `${seller._id}_profile`,
                width: 500,
                height: 500,
                crop: 'fill'
            })
            
            await Seller.findByIdAndUpdate(seller._id, {
                avatar: result.secure_url,
                avatarId: result.public_id,
                updatedAt: date
            })

            return res.status(201).json('imagem alterada com sucesso!')
        } catch (error) {
            console.log('erro ao subir imagem', error)
            return res.status(500).json('Erro ao alterar a imagem, por favor tente novamente mais tarde!')
        }
    }
};