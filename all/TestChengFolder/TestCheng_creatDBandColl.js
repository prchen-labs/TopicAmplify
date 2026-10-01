const express_cheng = require('express');
const router = express_cheng.Router();
// const mongoose = require('mongoose');
const {MongoClient} = require('mongodb');
// 測試連接TestCheng
// router.get('/', (req, res) => {
//   res.send('Hello from TestCheng.js!');
// });


async function main(){
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
     */
//     const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/test?retryWrites=true&w=majority";
//      const uri = "mongodb://127.0.0.1:27017/express-auth";
    const uri = "mongodb://127.0.0.1:27017";

    const client = new MongoClient(uri);
 
    try {
        // Connect to the MongoDB cluster
        await client.connect();
 
        // Make the appropriate DB calls
//         await  listDatabases(client);
        
        // Create a new database
        const db = client.db("sample_event_DB");
        // Create a new collection in the database
        db.createCollection("sample_event_Coll", function(err, res) {
            if (err) {
              console.error(err);
              return;
            }
            console.log("Collection created!");
            
        });
        await  listDatabases(client);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main().catch(console.error);//執行main fun

async function listDatabases(client) {
    databasesList = await client.db().admin().listDatabases();

    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

//ChatGPT
// // 定義數據庫模型
// const Data = mongoose.model('Data', { value: String });

// // 連接到MongoDB數據庫
// mongoose.connect('mongodb://127.0.0.1:27017/test', { useNewUrlParser: true });

// router.get('/', (req, res) => {
//   // 檢索數據
//   Data.find({}, (err, data) => {
//     if (err) {
//       res.status(500).send(err);
//     } else {
//       res.json(data);
//     }
//   });
// });
// ChatGPT
module.exports = router;