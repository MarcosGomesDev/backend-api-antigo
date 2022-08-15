const mongoose = require('mongoose');
const {Schema} = mongoose;

const productSchema = Schema({
    name: String,
    descrip: String,
    price: Number,
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    subcategory: {
        type: Schema.Types.ObjectId,
        ref: 'sub_category'
    },
    images: [String],
    publicImages: [String],
    comments: [
        {
            name: String,
            comment: String,
        }
    ],
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'Seller'
    },
    createdAt: String,
    updatedAt: String
})
productSchema.index({'name': 'text', 'descrip': 'text'})
module.exports = mongoose.model('Product', productSchema)