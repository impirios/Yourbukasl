var express = require('express');
var path = require('path');
var bcrypt = require('bcryptjs');
var Mongoose = require('mongoose');
var bodyParser = require('body-parser');
const User = require('./src/models/user');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const { resolve } = require('path');
const { rejects } = require('assert');
const { model } = require('./src/models/user');
const Card = require('./src/models/Card');
var app = express();


const options = {
    useNewUrlParser: true,
    useCreateIndex: true,
    autoIndex: true, //this is the code I added that solved it all
    keepAlive: true,
    poolSize: 10,
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
    useFindAndModify: false,
    useUnifiedTopology: true
};


const Mongouri = "Add your mongo URL";
Mongoose.connect(Mongouri,options);

app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());


let conn = Mongoose.connection;
let gfs;
conn.once('open',()=>{
    gfs = Grid(conn.db,Mongoose.mongo);
    gfs.collection('images');
});


//defining the middleware for multer so this will be called everytiime a new image is uploaded using multer 
let storage = new GridFsStorage({
    url:Mongouri,
    file:(req,file)=>{
        return new Promise(
            (resolve,reject)=>{
                const fileInfo = {
                    filename:Mongoose.Types.ObjectId()+file.originalname,
                    bucketName:"images"
                };
                resolve(fileInfo);
            }
        );
    }

});


//initialising multer with the middleware 
const upload = multer({storage});



//endpoints routes 
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/api/signup',(req,res)=>{
    res.sendFile(path.join(__dirname+'/signup.html'));

});

app.get('/api/login',(req,res)=>{
    res.sendFile(path.join(__dirname+'/login.html'));

});

app.get('/api/uploadCard',(req,res)=>{
    res.sendFile(path.join(__dirname+'/newcard.html'));

});

//endpoint routes ends


//api routes 

//to upload a card image
app.post('/api/uploadCard',upload.single("upload"),(req,res)=>{

    if(req.body.category!='Premium'&&req.body.category!='Basic')                  //throw an error if the category does not belong to Basic or premium 
    {
        return res.send({error:"Category "+req.body.category+" not defined"});
    }
    //new card object 
    var card = new Card({
        _id:new Mongoose.Types.ObjectId(),
        category:req.body.category,
        fileID:req.file.id,
        url:'/cards/'+req.file.filename
    });
    card.save().then(result=>{
        console.log(result);
        res.status(200);

        return res.send({cardadded:true});

    }).catch(err=>{
        console.log(err);
        res.status(404);
        return res.send({error:"Could not add the card"});
    });

});

//Signing up a new user
app.post('/api/signup',upload.single("upload"),function(req,res,next)
{
    console.log( req.body.Username);
    if(!(req.body.Username&&req.body.Password&&req.body.Email&&req.body.Dob&&req.body.Phonenumber))
    {
        return res.send({Error:"Incomplete information"});
    }
    console.log(req.body);
    let hash = bcrypt.hashSync(req.body.Password,14);                                               //Encrypting The user passwords
    req.body.Password = hash;

    var user = new User({                                                                          //Creating a new User object     
        _id:new Mongoose.Types.ObjectId(),
        UserName:req.body.Username,
        Email:req.body.Email,
        PhoneNumber:req.body.Phonenumber,
        DOB:req.body.Dob,
        Password:req.body.Password,
        Profile:'/images/'+req.file.filename
    });

    user.save().then(user=>{
        console.log(user);
        console.log("help");
        res.status(200);

        return res.send({usercreated:true,token:user._id});
    }).catch(err=>{
     console.log(err);
    if(err!=null)                                                                                   //Handling errors
    {
        var errmsg = [];


        if(err.name === "ValidationError")
        {
            console.log(err.errors);
            for (field in err.errors) {
                
                errmsg.push( err.errors[field].message); 
            }

        }
        res.status(404);
        res.send({errors:errmsg});
    }
    

    });

});

//Returns all the users in the database 
app.get('/api/users',(req,res)=>{
    User.find({},(err,users)=>{
        if(err){
            res.status(404);
            res.send("An error occured");
            return;
        }
        res.send(users);
    });
});


//Logging in a new user 
app.post('/api/login',function(req,res)
{
  console.log(req.body);
  User.findOne({Email:req.body.Email},(err,user)=>{
      if(err||!user||!bcrypt.compareSync(req.body.Password,user.Password)){
          res.status(404);
          return res.send({error:"Incorrect email/password."});
      }
      res.status(200);
      return res.send({Loggedin:true});
    }); 

});

//returns a User object 
app.post('/api/user/',(req,res)=>{
    User.findById(req.body.id,(err,user)=>{
        if(err||user===null){
            res.status(404);
            return res.send("User not found");
        }
        res.status(200);
        return res.send(user);
    });

});

//returns a images.files object 
app.get('/uploads/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        //check if files exist
        if (!file || file.length == 0) {
            return res.status(404).json({
                err: "No files exist"
            });
        }
        //file exist
        return res.json(file);
    });
});

//returns an image with name :filename
app.get('/images/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        //check if files exist
        if (!file || file.length == 0) {
            return res.status(404).json({
                err: "No files exist"
            });
        }
        //check if image
        if (file.contentType === 'image/jpeg' || file.contentType === "image/png") {
            //read output to browser
            const readStream = gfs.createReadStream(file.filename);
            readStream.pipe(res)
        } else {
            res.status(404).json({
                err: "Not an image"
            });
        }
    });
});

app.get('/cards/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        //check if files exist
        if (!file || file.length == 0) {
            return res.status(404).json({
                err: "No files exist"
            });
        }
        //check if image
        if (file.contentType === 'image/jpeg' || file.contentType === "image/png") {
            //read output to browser
            const readStream = gfs.createReadStream(file.filename);
            readStream.pipe(res)
        } else {
            res.status(404).json({
                err: "Not an image"
            });
        }
    });
});

//sends all the cards with category :category
app.get('/cards/category/:category', (req, res) => {
    Card.find({category:req.params.category},(err, files) => {

        if(err){
            res.status(404);
            return res.send("An error occured");
        }
        res.status(200);
        return res.send(files);

    });

});


//link users with there profile photos
app.post('/api/linkusers',(req,res)=>{
    User.findById(req.body.id1,(err,user)=>{
        if(err||user===null){
            res.status(404);
            return res.send("User not found");
        }
        User.findById(req.body.id2,(err,user2)=>{
            if(err||user2===null){
                res.status(404);
                return res.send("User not found");
            }
            var profile = user2.Profile;
            console.log(profile);
            user.updateOne(
                {$push:{ContactList:profile}},
                {safe: true, upsert: true, new : true},
                (err,model)=>{
                    if(err)
                    {
                        res.status(404);
                        return res.send("User not found");
                    }
                }


            );
            var profile = user.Profile;

            user2.updateOne(
                {$push:{ContactList:profile}},
                {safe: true, upsert: true, new : true},
                (err,model)=>{
                    if(err)
                    {
                        res.status(404);
                        return res.send("User not found");
                    }
                    res.status(200);
                    return res.send({Userlinked:true});
        
                }


            );

        });

    });
});

app.listen(process.env.PORT||3000,()=>{
    console.log("Server started");
});
