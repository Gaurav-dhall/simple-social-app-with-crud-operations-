const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/miniProject");

const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    posts:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ],
    profilePic: {
        type: String,
        default: "default.jpg"
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;