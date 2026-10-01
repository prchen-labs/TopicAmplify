const express_cheng = require('express');
const router = express_cheng.Router();
// const mongoose = require('mongoose');
const {MongoClient} = require('mongodb');
const fs = require('fs');
const path = require('path');
// 測試連接TestCheng
// router.get('/', (req, res) => {
//   res.send('Hello from TestCheng.js!');
// });


async function main(){
    //Connection URI
    const uri = "mongodb://127.0.0.1:27017";
    const client = new MongoClient(uri);
    try {
        // Connect to the MongoDB cluster
        await client.connect();        
        // Select DB. and Coll.
        const db = client.db("sample_event_DB");
        const collection = db.collection('Samp_evt_Coll_featureWords');
        // Find Doc.
        const jsonFilePath = path.join(__dirname,  'featureWords/nuk+nchu+ntnu+ntust+nyust+0228nkust+govFromOpenData.json');
        // Read Doc.
        const jsonString = fs.readFileSync(jsonFilePath);
        // parse
        const data = JSON.parse(jsonString);
        // 在每個物件中新增一個 "timestamp" 欄位，值為當前時間
        const timestamp = new Date();
        data.forEach(obj => obj.timestamp = timestamp);
//         console.log('Hello from TestCheng.js!');
//         console.log(data);
        const result = await collection.insertMany(data);// sum of data is 6974

        console.log(`${result.insertedCount} documents were inserted into the collection.`);

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