const express = require("express");
const app = express();
const port = 3000;

const cookieParser = require("cookie-parser");
const User = require("./models/user");
const post = require("./models/post");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


app.use(cookieParser());
app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());



app.get("/", (req, res) => {
    res.render("index");
});
app.get("/login", (req, res) => {
    res.render("login");
});
app.post("/register", async(req, res) => {
    let{username,name,age,email,password}=req.body;
   let user= await User.findOne({email});
   if(user) return res.status(400).send("user already exists");

   bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, async function(err, hash) {
        if(err) throw err;
      let user=  await User.create({
            username,
            name,
            age,
            email,
            password: hash
        });
       
        res.redirect("/login");
       
    });
});
});

app.post("/login",  async(req, res) => {
    let {email,password}=req.body;
    let user= await User.findOne({email});
    if(!user) return res.status(400).send("user not found");
    let match= await bcrypt.compare(password,user.password);
    if(!match) {
        res.status(400).send("wrong password");
        res.redirect("/login");
        return;
    
    }
    var token = jwt.sign({ email: user.email,userID : user._id }, 'shhhhh');
    res.cookie("token", token);
    res.redirect("/profile");
});

app.get("/logout", async(req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});
app.get("/profile",isLoggedIn, async(req, res) => {
 
    let user= await User.findOne({email:req.email}).populate("posts");
    // res.send(user);
   
    res.render("profile",{user});

});


app.get("/delete-post/:id",isLoggedIn, async(req, res) => {
 
    let user= await User.findOne({email:req.email});
    let currentpost= await post.findOne({_id:req.params.id});
    user.posts.splice(user.posts.indexOf(currentpost._id),1);
    await user.save();
    await post.deleteOne({_id:req.params.id});
    res.redirect("/profile");

});


app.get("/edit-post/:id",isLoggedIn, async(req, res) => {
    let currentpost= await post.findOne({_id:req.params.id});
    
 
    res.render("edit-post",{currentpost});

});
app.post("/edit-post/:id",isLoggedIn, async(req, res) => {
    
    let currentpost= await post.findOne({_id:req.params.id});
    console.log(currentpost);
    
    currentpost.content=req.body.editedContent;
    await currentpost.save();
    res.redirect("/profile");

});


app.get("/like-post/:id",isLoggedIn, async(req, res) => {
        let currentpost = await post.findOne({ _id: req.params.id });
        let user = await User.findOne({ email: req.email });
        if(currentpost.likes.indexOf(user._id)===-1){
            currentpost.likes.push(user._id);
            await currentpost.save();
        }

        else{
            currentpost.likes.splice(currentpost.likes.indexOf(user._id),1);
            await currentpost.save();
        }
        res.redirect("/profile");


   
 

});


app.post("/create-post",isLoggedIn, async(req, res) => {
 
   let user = await User.findOne({email:req.email});
   let {content}=req.body;
    let newPost= await post.create({
      
         content:content,
         user:user._id
    });
    user.posts.push(newPost._id);
    await user.save();
    res.redirect("/profile");

});

function isLoggedIn(req,res,next){
    const token = req.cookies.token;
   if(token===""){
        res.redirect("/login");
        return;
   }
   jwt.verify(token, 'shhhhh', function(err, decoded) {
    if(err) {
        res.send("invalid token");
        return;
    }
    req.email=decoded.email;
    req.userID=decoded.userID;
    next();
  });
}
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});