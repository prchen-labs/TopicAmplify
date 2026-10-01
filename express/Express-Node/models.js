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


/*
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;


const mongoose = require("mongoose");

mongoose.connect('mongodb://127.0.0.1:27017/express-auth', {
    useNewUrlParser: true
} );

/*
class display {
    constructor(mongo_url = "mongodb://127.0.0.1:27017/", dbname) {
        this.dbname = dbname;
        this.conn = mongoose.connect(mongo_url);
    }
    
    find() {
        const db = this.conn.db(this.dbname);
        var result;
        db.collection("searches").find({}).toArray(function (err, r) {
            if (err) throw err;
            result = r ;
        });
        return result;
    }
    close(){
       this.conn.close();
    }    
}
*/


/*
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
*/
/*
// 定義活動模型
const SearchSchema = new mongoose.Schema ( {
    content: { type: Array },
    time: { type: String },
    title: { type: String },
    url: { type: String }
} );
*/
//const User = mongoose.model('User', UserSchema);
//const Search = mongoose.model('Search', SearchSchema);

// 刪除資料庫集合
//User.db.dropCollection('users');
//module.exports = { User };
//module.exports = { Search };
