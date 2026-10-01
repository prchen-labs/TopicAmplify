// const express_cheng = require('express');
// const router = express_cheng.Router();
// const mongoose = require('mongoose');
const {
	MongoClient
} = require('mongodb');
const fs = require('fs');
const path = require('path');
// const https = require("https");
//http通訊設定
const https = require('https');
// 定義一個 MongoDB 連接器
class MongoDBConnector {
	constructor(uri) {
		this.uri = uri;
		this.client = null;
		this.db = null;
	}
	// 連接 MongoDB 資料庫
	async connectAndCreatDBAndColl(dbName, collectionName) {
		try {
			// 建立 MongoDB 用戶端連接
			this.client = new MongoClient(this.uri, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			});
			// 連接到 MongoDB
			await this.client.connect();
			// 獲取資料庫
			this.db = this.client.db(dbName);
			// 創建集合
			await this.db.createCollection(collectionName);
			console.log(`Connected to MongoDB database ${dbName}, collection ${collectionName}`);
		} catch (err) {
			console.error(err);
		}
	}
	// 斷開 MongoDB 連接
	async disconnect() {
		try {
			await this.client.close();
			console.log("Disconnected from MongoDB");
		} catch (err) {
			console.error(err);
		}
	}
}
class DataGetter {
	constructor(uri_, db_, collection_) {
		this.uri = uri_;
		this.db = db_;
		this.collection = collection_;
		this.client = new MongoClient(this.uri);
	}
	async getDataByHeat(key_ = "Heat") {
		await this.client.connect();
		const db = this.client.db(this.db);
		const collection = db.collection(this.collection);
		//     const data = await collection.find().sort({ [key_]: -1 });
		const data = await collection.find().sort({
			[key_]: -1
		}).toArray();
		await this.client.close();
		//      console.log("before return: ",typeof data); // object
		return data;
	}
	async getSortedData() {
		await this.client.connect();
		const db = this.client.db(this.db);
		const collection = db.collection(this.collection);
		const data = await collection.find().sort({
			timestamp: 1
		}).toArray();
		await this.client.close();
		return data;
	}
	async addData(data) {
		await this.client.connect();
		const db = this.client.db(this.db);
		const collection = db.collection(this.collection);
		// 為新增的資料添加時間戳
		data.timestamp = new Date();
		// 將資料加入集合中
		await collection.insertOne(data);
		await this.client.close();
	}
}
class MongoDBManager {
  constructor(uri, dbName, collectionName) {
    this.uri = uri;
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.client = new MongoClient(uri, { useUnifiedTopology: true });
  }

  async connect() {
    await this.client.connect();
  }

  async close() {
    await this.client.close();
  }

  async insertMany(data) {
    const db = this.client.db(this.dbName);
    const collection = db.collection(this.collectionName);
    const result = await collection.insertMany(data);
    return result;
  }
}



async function main() {
	//     const dataGetter = new ChengAPI.DataGetter("mongodb://127.0.0.1:27017", "sample_event_DB", "sample_event_Coll");
	//     const newData = { title: "測試", content: "測試" };
	//     await dataGetter.addData(newData);
	// 使用方法
	const dataGetter = new DataGetter("mongodb://127.0.0.1:27017", "sample_event_DB", "sample_event_Coll");
	const data = await dataGetter.getDataByHeat("_id"); //可指定key//defaut:"Heat". "_id"
// 	console.log(typeof(data));
//     console.log(data);
    
    const uri = 'mongodb://localhost:27017';
    const dbName = 'sample_event_DB';
    const collectionName = 'NewEvent';
    (async () => {
        const manager = new MongoDBManager(uri, dbName, collectionName);
        await manager.connect();
        const result = await manager.insertMany(data);
        console.log(result.insertedCount + ' records inserted.');
        await manager.close();
    })();
    
}
main();
// module.exports = MongoDBManager;
module.exports = {
	DataGetter
};
// // 使用方法
// const dataGetter = new DataGetter("mongodb://123.10.10.10:12345", "sample_event_DB", "sample_event_Coll");
// const data = await dataGetter.getDataByHeat();//可指定key
// console.log(data);
/*
manual: MongoDBConnector
// 使用 MongoDBConnector 類別
const connector = new MongoDBConnector("mongodb://localhost:27017");
await connector.connect("mydatabase", "mycollection");
await connector.disconnect();
*/
/*
manual~
在這個範例中，我們定義了一個 MongoDBConnector 類別，用來連接 MongoDB 資料庫和創建資料庫和集合。它有一個 uri 屬性，用來存儲 MongoDB 連接字串，以及一個 client 屬性和一個 db 屬性，分別用來存儲 MongoDB 用戶端連接和資料庫連接。

該類別還定義了一個 connect 方法，用來連接 MongoDB 資料庫，並創建指定的資料庫和集合。該方法使用 MongoDB 的 Node.js 驅動程式提供的 MongoClient 類別，並使用 await 關鍵字來等待資料庫操作的完成。在方法中，我們創建了一個 MongoClient 實例，使用 connect 方法連接到 MongoDB 資料庫，獲取指定的資料庫，創建指定的集合，並輸出一個訊息，表示已經成功連接到 MongoDB 資料庫和創建了集合。

該類別還定義了一個 disconnect 方法，用來斷開 MongoDB 連接。

最後，我們使用 MongoDBConnector 類別來連接到 MongoDB 資料庫，並使用 await 關鍵字來等待連接和斷開的操作完成。
*/