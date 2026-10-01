const express_cheng = require('express');
const {
	MongoClient
} = require('mongodb');
const ObjectId = require('mongodb').ObjectId;//new at 03/26, exe test yet
const fs = require('fs');
const path = require('path');
class TermFrequencyMatrixBuilder {
	constructor(uri = 'mongodb://127.0.0.1:27017') {
		this.client = new MongoClient(uri, {
			useUnifiedTopology: true
		});
	}
	async connect() {
		await this.client.connect();
	}
	async getDocuments(dbName, collectionName) {
		const db = this.client.db(dbName);
		const collection = db.collection(collectionName);
		return await collection.find().toArray();
	}
	async buildTermFrequencyMatrix(dbName, collectionName) {
		const documents = await this.getDocuments(dbName, collectionName);
		//         console.log('documents\n',documents)
		const termsIndex = {}; //紀錄所有的詞(詞彙庫)。 "詞1":1, "詞2":2, "詞3":3, "詞x":x,...
		const termFrequencyMatrix = {
			id: [], //6954
			EventID: [],
			rowPtr: [0], //6955 多一個(正常，最後是指下一個的檔案開頭)。存放詞頻矩陣每一行的起始索引
			colInd: [], //存放詞頻矩陣中每一個詞的索引
			data: [], //存放詞頻矩陣中每一個詞的出現次數
		};
		let termsCounter = 0;
		documents.forEach(doc => {
			let nonZeroValues = 0; // 紀錄多少詞
			const termCount = {}; //單個文本有的少詞。"詞1": 詞頻(詞出現次數)
			doc.TitleAndDESC.forEach(term => {
				termCount[term] = (termCount[term] || 0) + 1;
				if (!termsIndex.hasOwnProperty(term)) {
					termsIndex[term] = termsCounter;
					termsCounter++;
				}
			});
			Object.keys(termCount).forEach(term => {
				nonZeroValues++;
				termFrequencyMatrix.colInd.push(termsIndex[term]);
				termFrequencyMatrix.data.push(termCount[term]);
			});
			termFrequencyMatrix.rowPtr.push(termFrequencyMatrix.rowPtr[termFrequencyMatrix.rowPtr.length - 1] + nonZeroValues);
			termFrequencyMatrix.id.push(doc._id);
			termFrequencyMatrix.EventID.push(doc.EventID)
		});
		return termFrequencyMatrix;
	}
	async getTopTenIds_sparseMatrix(sparseMatrix) {
		return sparseMatrix[0].id.slice(0, 10);
	}
	async getTopTenEventIDs_sparseMatrix(sparseMatrix) {
		return sparseMatrix[0].EventID.slice(0, 10);
	}
	async getFinalTenEventIDs_sparseMatrix(sparseMatrix) {
		return sparseMatrix[0].EventID.slice(-10);
	}
	async getTopTenIds_orinDocs(Docs) {
		return Docs.slice(0, 10).map(doc => doc._id);
	}
}
class MongoDBStorage {
	constructor(uri = 'mongodb://127.0.0.1:27017') {
		this.client = new MongoClient(uri);
	}
	async connect() {
		await this.client.connect();
	}
	async storeData(dbName, collectionName, data) { //note: this it will deleteMany (delete all first)
		const db = this.client.db(dbName);
		const collection = db.collection(collectionName);
		try {
			const result = await collection.insertMany(data);
			console.log('Data stored successfully:', result.insertedCount);
		} catch (error) {
			console.error('Error storing data:', error);
		}
	}
	async storeData_DeleteAndPut(dbName, collectionName, data) { //note: this it will deleteMany (delete all first)
		const db = this.client.db(dbName);
		const collection = db.collection(collectionName);
		try {
			await collection.deleteMany({}); //note: this it will deleteMany (delete all first)
			const result = await collection.insertMany(data);
			console.log('Data stored successfully:', result.insertedCount);
		} catch (error) {
			console.error('Error storing data:', error);
		}
	}
	async disconnect() {
		await this.client.close();
	}
}
class CosineSimilarityCalculator2 {
	constructor(sparseMatrix) {
		this.sparseMatrix = sparseMatrix;
	}
	getIndex(id) { //id是EventID
		const rowIndex = this.sparseMatrix.EventID.findIndex((element) => element === id);
		if (rowIndex == -1) {
			throw new Error('EventID is not found');
		}
		return rowIndex;
	}
	getRow(id) {
		const rowIndex = this.getIndex(id);
		// 		if (rowIndex == (-1)) {
		// 			throw new Error('rowIndex is not exit');
		// 		}
		const start = this.sparseMatrix.rowPtr[rowIndex];
		const end = this.sparseMatrix.rowPtr[rowIndex + 1];
		const row = {};
		for (let i = start; i < end; i++) {
			row[this.sparseMatrix.colInd[i]] = this.sparseMatrix.data[i];
		}
		return row;
	}
	dotProduct(rowA, rowB) {
		let product = 0;
		for (const key in rowA) {
			if (rowB.hasOwnProperty(key)) {
				product += rowA[key] * rowB[key];
			}
		}
		return product;
	}
	magnitude(row) {
		let sum = 0;
		for (const key in row) {
			sum += row[key] * row[key];
		}
		return Math.sqrt(sum);
	}
	cosineSimilarity(rowA, rowB) {
		const dotProduct = this.dotProduct(rowA, rowB);
		const magnitudeA = this.magnitude(rowA);
		const magnitudeB = this.magnitude(rowB);
		if (magnitudeA === 0 || magnitudeB === 0) {
			return 0;
		}
		return dotProduct / (magnitudeA * magnitudeB);
	}
	getSimilarityList(targetId) {
		const targetRow = this.getRow(targetId);
		const similarities = [];
		for (let i = 0; i < this.sparseMatrix.EventID.length; i++) { //已改用EventID去找
			if (this.sparseMatrix.EventID[i] == targetId) {
				continue;
			}
			const otherRow = this.getRow(this.sparseMatrix.EventID[i]);
			const similarity = this.cosineSimilarity(targetRow, otherRow);
			if (similarity > 0.01) { //相似度在0.01以下就不要了
				similarities.push({
					id: this.sparseMatrix.id[i],
					EventID: this.sparseMatrix.EventID[i],
					similarity,
				});
			}
		}
		return similarities.sort((a, b) => b.similarity - a.similarity);
	}
	getTop10EventIDs_similarityList(similarityList) {
		const top10Ids = [];
		for (let i = 0; i < 10 && i < similarityList.length; i++) {
			// 			top10Ids.push(similarityList[i].id);
			top10Ids.push(similarityList[i].EventID);
		}
		return top10Ids;
	}
	async calculateAllSimilarity(sparseMatrix) { //TypeError: Cannot read properties of undefined (reading 'EventID')
		const jsonOutput = [];
		//         let similarityList;
		for (let targetId of sparseMatrix[0].EventID) { //this.sparseMatrix.EventID.length
			const similarityList = this.getSimilarityList(targetId);
			const jsonObj = {
				EventID0308: eventId,
				similarityList: similarityList
			};
			jsonOutput.push(jsonObj);
		}
		return jsonOutput;
	}
	async getSimilarityJson(startEventId_index, endEventId_index, sparseMatrix) {
		const jsonOutput = [];
		for (let eventId_index = startEventId_index; eventId_index < endEventId_index; eventId_index++) { // because of <, can input sparseMatrix[0].EventID.length(endEventId_index)
			let eventId = sparseMatrix.EventID[eventId_index]; //sparseMatrix[0].EventID.length
			const similarityList = this.getSimilarityList(eventId);
			const jsonObj = {
				EventID0308: eventId,
				similarityList: similarityList
			};
			jsonOutput.push(jsonObj);
		}
		return jsonOutput;
	}
}
class EventCollection {
	constructor(dbUrl, dbName, collectionName) {
		this.dbUrl = dbUrl;
		this.dbName = dbName;
		this.collectionName = collectionName;
		this.client = null;
		this.db = null;
		this.collection = null;
	}
	async connect() {
		this.client = await MongoClient.connect(this.dbUrl, {
			useUnifiedTopology: true
		});
		this.db = this.client.db(this.dbName);
		this.collection = this.db.collection(this.collectionName);
	}
	async disconnect() {
		await this.client.close();
	}
	async findById(id) {
		const result = await this.collection.findOne({
			_id: new ObjectId(id)
		});
		if (!result) {
			//             throw new Error(`${id} does not exist`);
			console.log(`${id} does not exist`);
		}
		return result;
	}
	async findByEventID0308Value(eventID0308Value) {
		const result = this.collection.findOne({
			EventID0308: eventID0308Value
		});
		if (!result) {
			//             throw new Error(`${id} does not exist`);
			console.log(`EventID: ${id} does not exist`);
		}
		return result;
	}
	async deleteById(id) {
		const result = await this.collection.deleteOne({
			_id: new ObjectId(id)
		});
		if (result) {
			console.log(`${id} delte successfully`);
		} else {
			console.log(`${id} fail to delte`);
		}
		return result.deletedCount;
	}
}
async function findNaNIndex(arr) {
	const NaNIndex = [];
	for (let i = 0; i < arr.length; i++) {
		if (isNaN(arr[i])) {
			NaNIndex.push(i);
		}
	}
	return NaNIndex;
}
module.exports = {
	//     TermFrequencyMatrixBuilder,
	//     MongoDBStorage,
	//     CosineSimilarityCalculator2,
	EventCollection: EventCollection
	//     findNaNIndex
};
/*
前景提要：
1. mongodb內sample_event_DB內的similarityList放 相似度的清單
2. mongodb內sample_event_DB內的sample_event_Coll放 原文本(有兩筆測試資料)
    PS 測試資料_id
    _id: new ObjectId("641252519e52d3d6b8f7e81a")
    _id: new ObjectId("6412522d9e52d3d6b8f7e819")
3. mongodb內sample_event_DB內的sample_event_Coll_copy放 原文本(沒有測試資料)
*/
/* 
// 使用方法
應用：從資料庫拿對應EventID的similarityList
1. 設定：目標的EventID (note：EventID沒有0)
let targetEventID_similarityList = 1; //targetId=targetEventID
2. 建立物件並連線：並連結對應的 uri, database, collection
//物件初始化輸入：uri, database, collection；再用connect函式連接
const eventCollection_similarityList = new EventCollection('mongodb://localhost:27017', 'sample_event_DB', 'similarityList'); 
await eventCollection_similarityList.connect();
3. 取出對應目標的similarityList：
//用findByEventID0308Value函式：輸入：目標的EventID；輸出：similarityList
let theSimilarityList = await eventCollection_similarityList.findByEventID0308Value(targetEventID_similarityList);
4. 連線取消
//請記得斷連線，否則cmd會一直執行狀態
await eventCollection_similarityList.disconnect(); 
5. 取出最相似文本(0號)的EventID
let theCorrespondingArticleEventID = theSimilarityList.similarityList[0].EventID;
----------------------------------------------------------------------------------
PS
6. 從EventID尋找原文本
 6.1 建構 mongodb collection 操作的物件(EventCollection物件專門操作mongodb的collection)
     輸入原文本的所在位置：uri, database, collection //colleciton是原文本位置，上面的是相似度清單位置(similarityList)
     const eventCollection = new EventCollection('mongodb://localhost:27017', 'sample_event_DB', 'sample_event_Coll_copy');
 6.2 連線
    await eventCollection.connect();
 6.3 用findByEventID0308Value函式找原文本
  findByEventID0308Value函式專門從EventID(or EventID0308)中找出對應的元素
  輸入：EventID(or EventID0308)
  輸出：元素
  程式碼：
	let orinDataArticle = await eventCollection.findByEventID0308Value(targetEventID_similarityList);
    let ortherDataArticle = await eventCollection.findByEventID0308Value(theCorrespondingArticleEventID);
    輸出格式：
        {
            _id: ObjectId("640f4987b55fa855f4d16c9e"),
            content: [
              '\n\n  '
            ],
            time: '',
            title: '國立高雄大學推廣教育中心',
            url: 'https://eec.nuk.edu.tw/',
            EventID0308: 19, //對應妳輸入的EventID (or EventID0308)
            Heat: 7,
            timestamp: ISODate("2023-03-13T16:04:23.880Z")
        }
7. 連線取消
//請記得斷連線，否則cmd會一直執行狀態
await eventCollection.disconnect(); 
8. check
console.log("orinDataArticle:\n",orinDataArticle);
console.log("ortherDataArticle:\n",ortherDataArticle);
*/
/*
theSimilarityList的輸出樣子(similarityList是有根據相似度排序-降序)，如下
程式碼：
console.log("theSimilarityList.similarityList of the Similarity List :\n", theSimilarityList.similarityList);
輸出：
{ // 這是一個Object，這Object裡面有array
  [ // 這是一個array，按照相似度分數排序
    { // 0 號：最相似目標的文本資訊
      id: new ObjectId("64149fcf6aad9611e1c77e3e"),
      EventID: 1472, // 最相似目標的文本的EventID(對應EventID0308)
      similarity: 0.39140176903175106 // 新似度分數
    },
    { //1 號：第二相似目標的文本資訊
      id: new ObjectId("64149fcf6aad9611e1c78442"),
      EventID: 3016, // 第二相似目標的文本的EventID(對應EventID0308)
      similarity: 0.3906343313417637 // 新似度分數
    },
    ... 3250 more items
  ]
}
*/