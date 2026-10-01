const mongoose = require("mongoose");
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/express-auth', {
    useNewUrlParser: true
} );

// 定義用戶模型
const UserSchema = new mongoose.Schema ( {
    username: { type: String, unique: true },
    password: { 
        type: String, 
        set(val) {
            // 用戶註冊密碼放進資料庫加密
            // .hashSync() 表示用散列方法(同步)進行加密
            return require("bcrypt").hashSync(val, 10);
        } 
    },
    email: { type: String }
} );

const User = mongoose.model('User', UserSchema);

// 刪除資料庫集合
//User.db.dropCollection('users');
module.exports = { User };