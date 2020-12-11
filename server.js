var express = require('express');
var path = require('path');
var bcrypt = require('bcryptjs');
var Mongoose = require('mongoose');
var bodyParser = require('body-parser');
const User = require('./src/models/user');

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


const uri = "mongodb+srv://impirios:LAPDHAPD@cluster0.vwylo.mongodb.net/test?retryWrites=true&w=majority";

Mongoose.connect(uri,options);

app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/api/signup',(req,res)=>{
    res.sendFile(path.join(__dirname+'/signup.html'));

});

app.get('/api/login',(req,res)=>{
    res.sendFile(path.join(__dirname+'/login.html'));

});


app.post('/api/signup',function(req,res,next)
{
    console.log(req.body);

    if(!(req.body.Username&&req.body.Password&&req.body.Email&&req.body.Dob&&req.body.Phonenumber))
    {
        return res.send({Error:"Incomplete information"});
    }
    console.log(req.body);
    let hash = bcrypt.hashSync(req.body.Password,14);
    req.body.Password = hash;

    var user = new User({
        _id:new Mongoose.Types.ObjectId(),
        UserName:req.body.Username,
        Email:req.body.Email,
        PhoneNumber:req.body.Phonenumber,
        DOB:req.body.Dob,
        Password:req.body.Password
    });

    user.save().then(user=>{
        console.log(user);
        console.log("help");
        res.status(200);
        return res.send({usercreated:true});
    }).catch(err=>{
     console.log(err);
    if(err!=null)
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

app.listen(process.env.PORT||3000,()=>{
    console.log("Server started");
});