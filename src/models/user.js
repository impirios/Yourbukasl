let mongoose = require('mongoose');
const {default:validator} = require('validator');

let userSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    UserName:{
        type:String,
        required:true,
    },
    Email:{
        type:String,
        required:true,
        unique:true,
        validate:(value)=>{
            return validator.isEmail(value);
        }
    },
    PhoneNumber:{
        type:String,
        required:true
    },
    DOB:{
        type:Date,
        required:true
    },
    Password:{
        type:String,
        required:true
    }
});


userSchema.path('Email').validate(async(email)=>{
    console.log(email);
    const Ecount = await mongoose.models.User.countDocuments({Email:email});
    return !Ecount;
},'Email already exists');



module.exports = mongoose.model('User',userSchema);