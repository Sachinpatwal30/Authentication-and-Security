require("dotenv").config();
const express = require("express");
const bodyParser= require("body-parser");
const ejs= require("ejs");
const mongoose= require("mongoose");
const bcrypt= require("bcrypt");
const saltRounds=10;    





const app= express();
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}))

mongoose.connect("mongodb://localhost:27017/userDB");


const userSchema= new mongoose.Schema({

    email:String,
    password:String
});





const User= mongoose.model("User",userSchema);



app.get("/",(req,res)=>{


    res.render("home");

});
app.get("/login",(req,res)=>{


    res.render("login");

});


app.get("/register",(req,res)=>{


    res.render("register");

});


app.post("/register",(req,res)=>{


    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        


        const newUser= new User({

            email:req.body.username,
            password:hash
        })
    
        newUser.save((err)=>{
    
            if(err)
            console.log(err)
            else
            res.render("secrets");
    
        });


    });



   

});

app.post("/login",(req,res)=>{

    const username=req.body.username;
    const password=req.body.password;

    User.findOne({email:username},(err,foundUser)=>{
  
        if(err)
        console.log(err)
        else
        {
             if(foundUser)
             {


                bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
                    
                         if(result===true)
                         res.render("secrets");
                         else
                         console.log("Incorrect Password");

                });
             }
             else
             console.log("user not found");

        }



    })

     

});



app.listen(3000,()=>{


console.log("server strated at port 3000");

})