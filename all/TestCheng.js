const express_cheng = require('express');
const router = express_cheng.Router();
// const mongoose = require('mongoose');
const {MongoClient} = require('mongodb');
const fs = require('fs');
const path = require('path');
// const CKIPClient = require('ckip-client')
// const { exec } = require('child_process');
const { PythonShell } = require('python-shell');
// 執行Python程式
// exec('./TestChengFolder/03016contentedBasdRecommend.ipynb', (error, stdout, stderr) => {
//   if (error) {
//     console.error(`執行Python程式時發生錯誤: ${error}`);
//     return;
//   }
//   console.log(`Python程式的輸出: ${stdout}`);
// });
const options = {
//   mode: 'text',//預設為 'text'
//   pythonPath: '/usr/bin/python',
    pythonPath: '/usr/bin/python3.9', // path to Python executable
//   pythonOptions: ['-u'],
//   scriptPath: '/path/to/my/scripts',
//   args: ['--input', 'file.txt']
};

PythonShell.run('/home/jupyter-selab/express/Express-Node/TestChengFolder/pythonPackage/content-based_Reco.py', options, function (err, results) {
  if (err) throw err;
  console.log('results: %j', results);
});
// PythonShell.runString('x=1+1;print(x)', null).then(messages=>{
//   console.log('finished');
// });
// PythonShell.runString('pip install ckipnlp', null,function (err, results) {
//   if (err) throw err;
//   console.log('results: %j', results);
// })
// PythonShell.run('pip', ['install', 'ckipnlp'], function (err, results) {
//   if (err) throw err;
//   console.log('results: %j', results);
// });

  

// 測試連接TestCheng
// router.get('/', (req, res) => {
//   res.send('Hello from TestCheng.js!');
// });
async function main(){
//     const uri = "mongodb://127.0.0.1:27017";
//     const client = new MongoClient(uri);
    try {
//      
    } catch (e) {
        console.error(e);
    } finally {
//         console.log(data);
//         await client.close();
    }
}

// main().catch(console.error);//執行main fun




async function getDataByHeat(uri_="mongodb://127.0.0.1:27017",db_="sample_event_DB",collection_="sample_event_Coll") {
    
//     const uri = "mongodb://127.0.0.1:27017";
    const client = new MongoClient(uri_);
    await client.connect();   
    
    const db = client.db(db_);
    const collection = db.collection(collection_);

    const data = await collection.find().sort({ Heat: -1 }).toArray();

//     console.log(data);
    await client.close();
}

async function listDatabases(client) {
    databasesList = await client.db().admin().listDatabases();

    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};
/*
await createListing(client,
        {
            name: "Lovely Loft",
            summary: "A charming loft in Paris",
            bedrooms: 1,
            bathrooms: 1
        }
    );
*/
async function createListing(client, newListing){
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").insertOne(newListing);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}
//https://www.mongodb.com/developer/languages/javascript/node-crud-tutorial/
async function createMultipleListings(client, newListings){
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").insertMany(newListings);

    console.log(`${result.insertedCount} new listing(s) created with the following id(s):`);
    console.log(result.insertedIds);       
}

// await findOneListingByName(client, "Infinite Views");
async function findOneListingByName(client, nameOfListing) {
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").findOne({ name: nameOfListing });// key(just name, have fixed): value(have not fixed)

    if (result) {
        console.log(`Found a listing in the collection with the name '${nameOfListing}':`);
        console.log(result);
    } else {
        console.log(`No listings found with the name '${nameOfListing}'`);
    }
}
// Read Doc https://www.mongodb.com/developer/languages/javascript/node-crud-tutorial/
// update
// await upsertListingByName(client, "Cozy Cottage", { name: "Cozy Cottage", bedrooms: 2, bathrooms: 1 });
async function upsertListingByName(client, nameOfListing, updatedListing) {
    const result = await client.db("sample_airbnb").collection("listingsAndReviews")
                        .updateOne({ name: nameOfListing }, 
                                   { $set: updatedListing }, 
                                   { upsert: true });
    console.log(`${result.matchedCount} document(s) matched the query criteria.`);

    if (result.upsertedCount > 0) {
        console.log(`One document was inserted with the id ${result.upsertedId._id}`);
    } else {
        console.log(`${result.modifiedCount} document(s) was/were updated.`);
    }
}
/*
await findListingsWithMinimumBedroomsBathroomsAndMostRecentReviews(client, {
            minimumNumberOfBedrooms: 4,
            minimumNumberOfBathrooms: 2,
            maximumNumberOfResults: 5
        });
*/
// delete - date
async function deleteListingsScrapedBeforeDate(client, date) {
    const result = await client.db("sample_airbnb").collection("listingsAndReviews")
        .deleteMany({ "last_scraped": { $lt: date } });
    console.log(`${result.deletedCount} document(s) was/were deleted.`);
}

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
