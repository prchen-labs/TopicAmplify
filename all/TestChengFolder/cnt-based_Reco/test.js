const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const ChengAPI = require("../ChengAPI.js");
// var util = require('util');//For ouputing String.uti.format
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
async function main() {
	const builder = new TermFrequencyMatrixBuilder();
	await builder.connect();
	let termFrequencyMatrix;
	try {
		// 1.compute the similarityJson
		//         const storage = await new MongoDBStorage();
		//         await storage.connect();
		// 		const sparseMatrix = await builder.getDocuments('sample_event_DB', 'TermFrequencyMatrix_EventID');        
		//         const calculator = await new CosineSimilarityCalculator2(sparseMatrix[0]);
		let startTime = performance.now();
		/*
//         1+2： Batch calculation and then Batch store (appoint a range)
        const limitPut = sparseMatrix[0].EventID.length;
        const staetIndex = 6000;
        const interval = 1000;
        for(let Batch=staetIndex;Batch < limitPut;Batch+=interval){//IF interval is one will error
            let startEventId_index = Batch;//if undefined, represent it is Out of range
            let endEventId_index = Batch+interval;
            if (endEventId_index > limitPut){
                endEventId_index = limitPut;//easy to forget the [0]
                console.log('endEventId_index changed: ',endEventId_index);
            }
            const similarityJson = await calculator.getSimilarityJson(startEventId_index, endEventId_index, sparseMatrix[0]);//IF interval is one will error (at here)
            console.log('similarityJson:\n', similarityJson); 
            // 2. similarityJson store into mongodb
            await storage.storeData(//在有詞語庫矩陣(CRS)的情快下，需要儲存。輸入：mongoDB內的目標位置(資料庫，Collection，你要儲存的詞語庫矩陣)；輸出：儲存成功or失敗；應用：儲存詞語庫矩陣(CRS)
                'sample_event_DB',
                'similarityList_multiStore',
                similarityJson // please note no []
            );
//             console.log('similarityJson.length:\n', similarityJson.length); 
        }
        */
		/*
//         1+2： Batch calculation and then Batch store (all)
        for(let Batch=0;Batch < sparseMatrix[0].EventID.length;Batch=Batch+1000){
            let startEventId_index = Batch;//if undefined, represent it is Out of range
            let endEventId_index = Batch+1000;
            if (endEventId_index > sparseMatrix[0].EventID.length){
                endEventId_index = sparseMatrix[0].EventID.length;//easy to forget the [0]
            }
            const similarityJson = await calculator.getSimilarityJson(startEventId_index, endEventId_index, sparseMatrix[0]);
            // 2. similarityJson store into mongodb
            await storage.storeData(//在有詞語庫矩陣(CRS)的情快下，需要儲存。輸入：mongoDB內的目標位置(資料庫，Collection，你要儲存的詞語庫矩陣)；輸出：儲存成功or失敗；應用：儲存詞語庫矩陣(CRS)
                'sample_event_DB',
                'similarityList_multiStore',
                similarityJson // please note no []
            );
        }
        */
		/* 1+2: must be put in 1+2
//         console.log('similarityJson:', similarityJson);
        let endTime = performance.now();
		console.debug('Elapsed time:', (endTime - startTime)); //毫秒為單位 10 recorder need 623.316025018692
        await storage.client.close();
        */
		/*out of memory
		const similarityList = await builder.getDocuments('sample_event_DB', 'similarityList_multiStore');//從mongoDB拿詞語庫稀疏矩陣。輸入：(資料庫，Collection)；輸出：無；應用：從mongoDB內的資料庫的Collection拿東西(整個拿出來)// out of memory
		console.log('similarityList.length:\n', similarityList.length);
		console.log('similarityList[-1].EventID0308:\n', similarityList[-1].EventID0308);
		*/
		//3. find targetEventID's  similarityList (theSimilarityList)
		let targetEventID_similarityList = 1000; //targetId=targetEventID
		const eventCollection_similarityList = new EventCollection('mongodb://localhost:27017', 'sample_event_DB', 'similarityList'); //Check用的Class
		await eventCollection_similarityList.connect();
		let theSimilarityList = await eventCollection_similarityList.findByEventID0308Value(targetEventID_similarityList); //應用：用EventID去找原活動資料文；輸入：EventID；輸出：原活動資料文
		//take (a)the entire SimilarityList
		        console.log("the Similarity List:\n", theSimilarityList);
		//take (a)the entire SimilarityList
		//         console.log("theSimilarityList.EventID0308 of the Similarity List :\n", theSimilarityList.EventID0308);
		//take (a)the similarityList
		//         console.log("theSimilarityList.similarityList of the Similarity List :\n", theSimilarityList.similarityList);
		//take (a)the _id of the similarityList
		//         console.log("theSimilarityList._id of the Similarity List :\n", theSimilarityList._id);
		//         theSimilarityList.similarityList[0].EventID can take the first similar EventID
		//take the first Similarity List correspond to theSimilarityList
		// 		console.log("the Similarity List 0th :\n", theSimilarityList.similarityList[0]);
		//take the EventID of first Similarity List correspond to theSimilarityList
		//         console.log("the Similarity List EventID in 0th :\n", theSimilarityList.similarityList[0].EventID);
		//4. check the similar doc(article)
		const eventCollection = new EventCollection('mongodb://localhost:27017', 'sample_event_DB', 'sample_event_Coll_copy'); //Check用的Class
		await eventCollection.connect();
		let orinDataArticle = await eventCollection.findByEventID0308Value(targetEventID_similarityList); //應用：用EventID去找原活動資料文；輸入：EventID；輸出：原活動資料文
		console.log("the original doc:\n", orinDataArticle);
		//  Specify the ID of the xth similarity (including 0)
		let xthSimilarity = 3;
		let theCorrespondingArticleEventID = theSimilarityList.similarityList[xthSimilarity].EventID;
		console.log(`the Corresponding EventID of Article in ${xthSimilarity}: ${theCorrespondingArticleEventID}`);
		console.log(`the Corresponding similarity of Article in ${xthSimilarity}: ${theSimilarityList.similarityList[0].similarity}`);
		orinDataArticle = await eventCollection.findByEventID0308Value(theCorrespondingArticleEventID); //應用：用_id去找原活動資料文；輸入：_id；輸出：原活動資料文
		console.log("the similar doc:\n", orinDataArticle);
		//         await storage.disconnect();
		await eventCollection.disconnect(); //請記得斷連線//否則cmd會一直執行狀態
		await eventCollection_similarityList.disconnect(); //請記得斷連線//否則cmd會一直執行狀態
	} catch (error) {
		console.error(error);
	} finally {
		await builder.client.close();
	}
}
main();