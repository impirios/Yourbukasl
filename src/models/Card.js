let mongoose = require('mongoose');
const {default:validator} = require('validator');

let CardSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    description: {
        type: String
    },
    category: {
    type: String,
    required:true
    },
    token: {
    type: String
    },
    fileID: {
    type: mongoose.Schema.Types.ObjectId,
    required:true // There is no need to create references here
    },
    url:{
        type:String,
        required:true
    }
    
});





module.exports = mongoose.model('Card',CardSchema);

