//contend-based Reco
// const express_cheng = require('express');
const {
	MongoClient
} = require('mongodb');
const ObjectId = require('mongodb').ObjectId; //new at 03/26, exe test yet
const fs = require('fs');
const path = require('path');
class TermFrequencyMatrixBuilder {
	constructor(uri = 'mongodb://127.0.0.1:27017') {
		this.client = new MongoClient(uri, {
			useUnifiedTopology: true
		});
		this.valid_pos = new Set(["Na", "Nb", "Nc", "Nv", "VA", "VAC", "VB", "VC", "VCL", "VD", "VE", "VF", "VG", "VH", "VHC", "VI", "VJ", "VK", "VL"]);
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
		const termsIndex = {}; //紀錄所有的詞(詞彙庫)，value是Index，將詞投射成整數。 "詞1":1, "詞2":2, "詞3":3, "詞x":x,...
		const termFrequencyMatrix = {
			ckip_id: [],
			rowPtr: [0], //5410 多一個(正常，最後是指下一個的檔案開頭)。存放詞頻矩陣每一行的起始索引
			colInd: [], //存放詞頻矩陣中每一個詞的索引
			data: [], //存放詞頻矩陣中每一個詞的出現次數
		};
		let termsCounter = 0; //總共有多少個詞
		documents.forEach((doc) => {
			let nonZeroValues = 0; // 紀錄多少詞//用在稀疏矩陣(CSR)rowPtr上的
			const termCount = {}; //單個文本有的少詞。"詞1": 詞頻(詞出現次數)
			doc.content.forEach((sentence) => {
				//                 console.log('sentence:\n',sentence)
				sentence.forEach((word) => {
					//                     console.log('word:\n',word)                    
					if (this.valid_pos.has(word.tag)) {
						termCount[word.word] = (termCount[word.word] || 0) + 1;
						if (!termsIndex.hasOwnProperty(word.word)) {
							termsIndex[word.word] = termsCounter;
							termsCounter++;
						}
					}
				});
			});
			Object.keys(termCount).forEach((term) => {
				nonZeroValues++;
				termFrequencyMatrix.colInd.push(termsIndex[term]);
				termFrequencyMatrix.data.push(termCount[term]);
			});
			termFrequencyMatrix.rowPtr.push(termFrequencyMatrix.rowPtr[termFrequencyMatrix.rowPtr.length - 1] + nonZeroValues);
			termFrequencyMatrix.ckip_id.push(doc._id);
			//             console.log('doc._id',typeof(doc._id))//object
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
    async disconnect() {
		await this.client.close();
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
		const rowIndex = this.sparseMatrix.ckip_id.findIndex((element) => element === id);
		if (rowIndex == -1) {
			throw new Error('sparseMatrix.ckip_id is not found');
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
		for (let i = 0; i < this.sparseMatrix.ckip_id.length; i++) { //已改用EventID去找
			if (this.sparseMatrix.ckip_id[i] == targetId) {
				continue;
			}
			const otherRow = this.getRow(this.sparseMatrix.ckip_id[i]);
			const similarity = this.cosineSimilarity(targetRow, otherRow);
			if (similarity > 0.01) { //相似度在0.01以下就不要了
				similarities.push({
					original_id: this.sparseMatrix.original_id[i],
					ckip_id: this.sparseMatrix.ckip_id[i],
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
	//eventId = ckip_id
	async getSimilarityJson(startEventId_index, endEventId_index, sparseMatrix) {
		const jsonOutput = [];
		for (let eventId_index = startEventId_index; eventId_index < endEventId_index; eventId_index++) { // because of <, can input sparseMatrix[0].EventID.length(endEventId_index)
			let eventId = sparseMatrix.ckip_id[eventId_index]; //sparseMatrix[0].EventID.length
			const similarityList = this.getSimilarityList(eventId);
			const jsonObj = {
				original_id: sparseMatrix.original_id[eventId_index],
				ckip_id: eventId,
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
			original_id: new ObjectId(id)
		});
		if (!result) {
			//             throw new Error(`${id} does not exist`);
			console.log(`${id} does not exist`);
		}
		return result;
	}
	async findBy_id(id) {
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
class TermFrequencyMatrixProcessor {
	constructor(database, collection, uri = 'mongodb://localhost:27017') {
		this.uri = uri;
		this.database = database;
		this.collection = collection;
	}
	async getCollectionContent() {
		const client = await MongoClient.connect(this.uri);
		try {
			const db = client.db(this.database);
			const content = await db.collection(this.collection).find().toArray();
			return content;
		} finally {
			client.close();
		}
	}
	addOriginalIdToTermFrequencyMatrix(termFrequencyMatrix, collectionContent) {
		const idMap = {};
		for (let i = 0; i < collectionContent.length; i++) {
			const {
				_id,
				original_id,
				ckip_id
			} = collectionContent[i];
			idMap[ckip_id.toString()] = original_id.toString();
		}
		const newTermFrequencyMatrix = {
			original_id: [],
			ckip_id: termFrequencyMatrix.ckip_id.slice(),
			rowPtr: termFrequencyMatrix.rowPtr.slice(),
			colInd: termFrequencyMatrix.colInd.slice(),
			data: termFrequencyMatrix.data.slice(),
		};
		for (let i = 0; i < termFrequencyMatrix.ckip_id.length; i++) {
			const ckipId = termFrequencyMatrix.ckip_id[i].toString();
			const originalId = idMap[ckipId];
			newTermFrequencyMatrix.original_id.push(new ObjectId(originalId));
		}
		return newTermFrequencyMatrix;
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
/*
async function main() {
	let startTime, endTime;
	const builder = new TermFrequencyMatrixBuilder();
	await builder.connect();
	let termFrequencyMatrix;
	let targetId;
	let similarityList;
	startTime = performance.now();
	try {
		const storage = await new MongoDBStorage();
		await storage.connect();
		const sparseMatrix = await builder.getDocuments('topic_Coll_Test', 'content_based_TermFrequencyMatrix');
		const calculator = await new CosineSimilarityCalculator2(sparseMatrix[0]);
		console.log('sparseMatrix[0].original_id.length: ', sparseMatrix[0].original_id.length);
		const limitPut = await sparseMatrix[0].original_id.length;
		const staetIndex = 0;
		const interval = 500;//有時候會失敗，就把這數值挑小
		for (let Batch = staetIndex; Batch < limitPut; Batch += interval) {
			let startEventId_index = Batch;
			let endEventId_index = Batch + interval;
			if (endEventId_index >= limitPut) {
				endEventId_index = limitPut;
			}
			const similarityJson_output = await calculator.getSimilarityJson(startEventId_index, endEventId_index, sparseMatrix[0]);
			await storage.storeData('topic_Coll_Test', 'content_based_CosineSimilarity_output', similarityJson_output);
			endTime = performance.now();
			console.log('Batch calculation and then Batch store (appoint a range) took: ', (endTime - startTime) / 1000, ' seconds');
		}
		endTime = performance.now();
		console.log('A ll Batch calculation and then Batch store (appoint a range) took: ', (endTime - startTime) / 1000, ' seconds');
	} finally {
		await builder.disconnect();
	}
}
main().catch(console.error);
*/
async function main() {
	/*
	//1. build a TermFrequencyMatrix (sparse matrix)
	const builder = new TermFrequencyMatrixBuilder();
	await builder.connect();
	let termFrequencyMatrix;
	try {
        //輸入：指定特徵詞來源(資料庫, collection);輸出：詞語庫矩陣;應用：製造詞語庫稀疏矩陣(CRS)
		termFrequencyMatrix = await builder.buildTermFrequencyMatrix( 
			'topic_Coll_Test', 'ckip');
		//         console.log('Terms Index:', termsIndex);
// 		console.log('Term Frequency Matrix (CSR format):\n', termFrequencyMatrix);
	} catch (error) {
		console.error(error);
	} finally {
		await builder.client.close();
	}
    // make orginal_id
    // Usage example
    const processor = new TermFrequencyMatrixProcessor('topic_Coll_Test', 'indexs');
    const collectionContent = await processor.getCollectionContent();
    const newTermFrequencyMatrix = processor.addOriginalIdToTermFrequencyMatrix(termFrequencyMatrix, collectionContent);
//     console.log(newTermFrequencyMatrix);
        //2. take sth(TermFrequencyMatrix (sparse matrix) into database
    const storage = new MongoDBStorage();
    await storage.connect();
    try {
    // 有需要先清空用storeData_DeleteAndPut
        await storage.storeData_DeleteAndPut(//在有詞語庫矩陣(CRS)的情快下，需要儲存。輸入：mongoDB內的目標位置(資料庫，Collection，你要儲存的詞語庫矩陣)；輸出：儲存成功or失敗；應用：儲存詞語庫矩陣(CRS)
          'topic_Coll_Test',
          'content_based_TermFrequencyMatrix',
          [newTermFrequencyMatrix]
    );
    } catch (error) {
        console.error(error);
    } finally {
    await storage.client.close();
    }
    */
    /*
	let startTime, endTime;
	//3. take sth(TermFrequencyMatrix (sparse matrix) from DB
	const builder = new TermFrequencyMatrixBuilder(); //方便從mongoDB拿東西，建立物件class
	await builder.connect();
	let termFrequencyMatrix;
	let targetId;
	let similarityList;
	startTime = performance.now();
	try {
		const storage = await new MongoDBStorage();
		await storage.connect();
		const sparseMatrix = await builder.getDocuments('topic_Coll_Test', 'content_based_TermFrequencyMatrix'); //從mongoDB拿詞語庫稀疏矩陣。輸入：(資料庫，Collection)；輸出：無；應用：從mongoDB內的資料庫的Collection拿東西(整個拿出來)
		//          console.log('sparseMatrix:\n', sparseMatrix);
        // 4. computer the simList
		//         1+2： Batch calculation and then Batch store (appoint a range)
        const calculator = await new CosineSimilarityCalculator2(sparseMatrix[0]);
        console.log('sparseMatrix[0].original_id.length: ', sparseMatrix[0].original_id.length);
        const limitPut = sparseMatrix[0].original_id.length;
// 		const limitPut = 1000;
		const staetIndex = 0;
		const interval = 500; //no 1,maybe seting 1000 will mem out
		for (let Batch = staetIndex; Batch < limitPut; Batch += interval) { //IF interval is one will error
			let startEventId_index = Batch; //if undefined, represent it is Out of range
			let endEventId_index = Batch + interval;
			if (endEventId_index > limitPut) {
				endEventId_index = limitPut; //easy to forget the [0]
				console.log('endEventId_index changed: ', endEventId_index);
			}
			const similarityJson = await calculator.getSimilarityJson(startEventId_index, endEventId_index, sparseMatrix[0]); //IF interval is one will error (at here)
			console.log('similarityJson:\n', similarityJson);
			// 2. similarityJson store into mongodb
			await storage.storeData( //在有詞語庫矩陣(CRS)的情快下，需要儲存。輸入：mongoDB內的目標位置(資料庫，Collection，你要儲存的詞語庫矩陣)；輸出：儲存成功or失敗；應用：儲存詞語庫矩陣(CRS)
				'topic_collection', 'similarityList_multiStore', similarityJson // please note no []
			);
			//             console.log('similarityJson.length:\n', similarityJson.length); 
		}
        //         1+2: must be put in 1+2
// 			console.log('similarityJson:', similarityJson);
			let endTime = performance.now();
			console.debug('Elapsed time:', (endTime - startTime)); //毫秒為單位 10 recorder need 623.316025018692
			await storage.client.close();
	} catch (error) {
		console.error(error);
	} finally {
		await builder.client.close();
	}
    */
    
        //3. find targetEventID's  similarityList (theSimilarityList) //補充byid = byoriginal_id, by_id = by_id
        let targetEventID_similarityList='64242d876ccbd541cce50dd9';//targetId=targetEventID
		const eventCollection_similarityList = new EventCollection('mongodb://localhost:27017', 'topic_Coll_Test', 'content_based_CosineSimilarity_output'); //Check用的Class
		await eventCollection_similarityList.connect();        
		let theSimilarityList = await eventCollection_similarityList.findById(targetEventID_similarityList); //應用：用EventID去找原活動資料文；輸入：EventID；輸出：原活動資料文
        //4. check the similar doc(article)
		const eventCollection = new EventCollection('mongodb://localhost:27017', 'topic_collection', 'original'); //Check用的Class
		await eventCollection.connect();
		let orinDataArticle = await eventCollection.findBy_id(targetEventID_similarityList); //應用：用EventID去找原活動資料文；輸入：EventID；輸出：原活動資料文
		console.log("the original doc:\n", orinDataArticle);
        //  Specify the ID of the xth similarity (including 0)
        let xthSimilarity = 0;
        console.log(Object.keys(theSimilarityList));
        let theCorrespondingArticleEventID = theSimilarityList.similarityList[xthSimilarity].original_id;
        console.log(`the Corresponding EventID of Article in ${xthSimilarity}: ${theCorrespondingArticleEventID}`);
        console.log(`the Corresponding similarity of Article in ${xthSimilarity}: ${theSimilarityList.similarityList[0].similarity}`);
		orinDataArticle = await eventCollection.findBy_id(theCorrespondingArticleEventID); //應用：用_id去找原活動資料文；輸入：_id；輸出：原活動資料文
		console.log("the similar doc:\n", orinDataArticle);
//         await storage.disconnect();
		await eventCollection.disconnect(); //請記得斷連線//否則cmd會一直執行狀態
		await eventCollection_similarityList.disconnect(); //請記得斷連線//否則cmd會一直執行狀態
        
}
// main()
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