const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://localhost:27017/sample_users', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "connection error: "));
// db.once("open", function () {
//     console.log("Connected successfully");
// });

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    verificationCode: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    }
});

UserSchema.pre('save', function (next) {
    const user = this;
    bcrypt.hash(user.password, 10, (err, hash) => {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});

const User = mongoose.model('accounts', UserSchema);

async function getUsersCount() {
    try {
        const count = await User.countDocuments({});
        return count;
    } catch (err) {
        console.log(err);
        return null;
    }
}

module.exports = {
    User,
    getUsersCount
};