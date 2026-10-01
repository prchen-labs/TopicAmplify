const mongoose = require("mongoose");
const userSchema = mongoose.Schema;

const userScehma = new Schema({
    username:{
        type: String,
        unique: true,
        require: true
    },
    password{
        type: Strnig,
        require: true
    },
    email{
         type: String,
         unique: true,
         require: true
    }
});

module.exports = mongoose.model('users', userSchema);