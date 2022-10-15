const mongoose = require('mongoose');
const {Schema} = mongoose
const PointSchema = require('../utils/pointSchema')

const sellerSchema = Schema({
    name: {type: String},
    email: {type: String},
    password: {type: String},
    address: {type: String},
    avatar: {type: String},
    seller: {type: Boolean},
    avatarId: String,
    products: [{
        type: Schema.Types.ObjectId,
        ref: 'Product'
    }],
    location: {
        type: PointSchema,
        index: '2dsphere'
    },
    address: [
        {
            type: String
        }
    ],
    socialMedias: [
        {
            type: String
        }
    ],
    createdAt: {type: String},
    updatedAt: {type: String}
});

module.exports = mongoose.model('Seller', sellerSchema);