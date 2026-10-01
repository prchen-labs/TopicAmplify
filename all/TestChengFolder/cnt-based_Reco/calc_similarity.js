const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
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
		const termsIndex = {}; //紀錄所有的詞(詞彙庫)。 "詞1":1, "詞2":2, "詞3":3, "詞x":x,...
		const termFrequencyMatrix = {
			id: [], //6954
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
		});
		return termFrequencyMatrix;
	}
    async getTopTenIds_sparseMatrix(sparseMatrix) {
        sparseMatrix=sparseMatrix[0]
        const topTenIds = [];
        const topTenMatrixRows = sparseMatrix.id.slice(0, 10);
//         for (const row of topTenMatrixRows) {
//             topTenIds.push(row.id.toString());
//         }
        return topTenMatrixRows;
    }
    async getTopTenIds_orinDocs(Docs){
        const topTenIds = [];
        const DocsTop = Docs.slice(0, 10);
        for (let i = 0; i < 10 && i < DocsTop.length; i++) {
            topTenIds.push(DocsTop[i]._id);
        }
        return topTenIds;
    }

}
class MongoDBStorage {
	constructor(uri = 'mongodb://127.0.0.1:27017') {
		this.client = new MongoClient(uri);
	}
	async connect() {
		await this.client.connect();
	}
	async storeData(dbName, collectionName, data) {
		const db = this.client.db(dbName);
		const collection = db.collection(collectionName);
		try {
			await collection.deleteMany({});
			const result = await collection.insertMany(data);
			console.log('Data stored successfully:', result.insertedCount);
		} catch (error) {
			console.error('Error storing data:', error);
		}
	}
}
class CosineSimilarityCalculator {
	constructor(sparseMatrix) {
		this.sparseMatrix = sparseMatrix;
	}
	getIndex(id) {
		const idStr = id.toString();
		const rowIndex = this.sparseMatrix.id.findIndex((element) => element.toString() === idStr);
		return rowIndex;
	}
	getRow(id) {
		//     const rowIndex = this.sparseMatrix.id.indexOf(id);
		const rowIndex = this.getIndex(id);
		//     console.log('rowIndex:', rowIndex);
		if (rowIndex == (-1)) {
			throw new Error('rowIndex is not exit');
		}
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
	getIndex(id) {
		const idStr = id.toString();
		const rowIndex = this.sparseMatrix.id.findIndex((element) => element.toString() === idStr);
		return rowIndex;
	}
	getSimilarityList(targetId) {
		const targetRow = this.getRow(targetId);
		//     console.log('targetRow', targetRow);
		//     return;
		const similarities = [];
		for (let i = 0; i < this.sparseMatrix.id.length; i++) {
			if (this.sparseMatrix.id[i].toString() == targetId.toString()) {
				continue;
			}
			//       console.log('this.sparseMatrix.id[i]', typeof(this.sparseMatrix.id[i]));//new ObjectId("64149fcf6aad9611e1c793ad")//object
			const otherRow = this.getRow(this.sparseMatrix.id[i]);
			const similarity = this.cosineSimilarity(targetRow, otherRow);
			if (similarity > 0.01) { //相似度在0.01以下就不要了
				similarities.push({
					id: this.sparseMatrix.id[i],
					similarity,
				});
			}
		}
		return similarities.sort((a, b) => b.similarity - a.similarity);
	}
    getTop10Ids_similarityList(similarityList) {
        const top10Ids = [];
        for (let i = 0; i < 10 && i < similarityList.length; i++) {
            top10Ids.push(similarityList[i].id);
        }
        return top10Ids;
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
    this.client = await MongoClient.connect(this.dbUrl, { useUnifiedTopology: true });
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection(this.collectionName);
  }

  async disconnect() {
    await this.client.close();
  }

  async findById(id) {
    return this.collection.findOne({ _id: new ObjectId(id) });
  }
}

// async function main() {   
//     let startTime, endTime;
//     startTime = performance.now();
//     const builder = new TermFrequencyMatrixBuilder();//If it is open in the front, please close it here
//     await builder.connect();
//     try {
//         const sparseMatrix = await builder.getDocuments(
//           'sample_event_DB',
//           'TermFrequencyMatrix2'
//         );
// //         console.log('sparseMatrix :', sparseMatrix );
//         let targetId
//          targetId = new ObjectId("64149fcf6aad9611e1c77884"); //object
//         const calculator = new CosineSimilarityCalculator(sparseMatrix[0]);
//         const similarityList = calculator.getSimilarityList(targetId);
//         console.log('Similarity List:', similarityList);
//                 //Get the end time
//         endTime = performance.now();
//         //The difference is how many milliseconds it took to call myFunction()
//         console.debug('Elapsed time:', (endTime - startTime));//毫秒為單位 4.7
//     } catch (error) {
//         console.error(error);
//     } finally {
//         await builder.client.close();
//     }
// }
// async function main() {  
//     const builder = new TermFrequencyMatrixBuilder();
//     await builder.connect();
//     try {
//     const docs = await builder.getDocuments(
//           'sample_event_DB',
//           'sample_event_Coll'
//         );
// //     console.log('docs:\n',docs[0]._id)
//     } catch (error) {
//         console.error(error);
//     } finally {
//         await builder.client.close();
//     }
// }
async function main() {
	const builder = new TermFrequencyMatrixBuilder(); //If it is open in the front, please close it here
	await builder.connect();
    let similarityList;
    let targetId;
    
	try {
		const sparseMatrix = await builder.getDocuments('sample_event_DB', 'TermFrequencyMatrix');
		 
		targetId = new ObjectId("64149fcf6aad9611e1c77884"); //object
		const calculator = new CosineSimilarityCalculator(sparseMatrix[0]);//sparseMatrix[0]
		similarityList = await calculator.getSimilarityList(targetId);
//         console.log('similarityList[0].id:', similarityList[0].id);
        //looke Top10 in  similarityList
        const Top10Ids = calculator.getTop10Ids_similarityList(similarityList);
        console.log('similarityList.id Top10Ids:\n', Top10Ids);
        //looke Top10 in original docs(article)
        const orinDos = await builder.getDocuments('sample_event_DB', 'sample_event_Coll');
        const opTenIds_orinocs =await builder.getTopTenIds_orinDocs(orinDos);
        console.log('Top ten IDs in orinocs:\n', opTenIds_orinocs);
        
        //looke Top10 in sparseMatrix
        const topTenIds_sparseMatrix = await builder.getTopTenIds_sparseMatrix(sparseMatrix);
        console.log('Top ten IDs in sparseMatrix:\n', topTenIds_sparseMatrix);
        
        
	} catch (error) {
        console.error(error);
    } finally {
        await builder.client.close();
    }
    //看看相似的檔案結果何以
    const dbUrl = 'mongodb://127.0.0.1:27017';
    const dbName = 'sample_event_DB';
    const collectionName = 'sample_event_Coll';

    const eventCollection = new EventCollection(dbUrl, dbName, collectionName);
    await eventCollection.connect();

    try {
        
        
//     const id = '640f4987b55fa855f4d16c9e'; //V
//         const id = new ObjectId("640f4987b55fa855f4d16c9e");//V
//         let id = new ObjectId("640f4987b55fa855f4d16c9e");
//         id=id.toString();//V
//         const id = similarityList[0].id.toString();// null
//         const id = similarityList[0].id //null
        
        const id =  targetId //null

        const result = await eventCollection.findById(id);
        console.log(result);
    } catch (err) {
        console.error(err);
    } finally {
        await eventCollection.disconnect();
    }
    
}
main();