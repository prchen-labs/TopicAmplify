const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
class TermFrequencyMatrixBuilder {
  constructor(uri = 'mongodb://127.0.0.1:27017') {
    this.client = new MongoClient(uri, { useUnifiedTopology: true });
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
    const termsIndex = {};//紀錄所有的詞(詞彙庫)。 "詞1":1, "詞2":2, "詞3":3, "詞x":x,...
    const termFrequencyMatrix = {
      id:[],//6954
      rowPtr: [0],//6955 多一個(正常，最後是指下一個的檔案開頭)。存放詞頻矩陣每一行的起始索引
      colInd: [],//存放詞頻矩陣中每一個詞的索引
      data: [],//存放詞頻矩陣中每一個詞的出現次數
    };

    let termsCounter = 0;

    documents.forEach(doc => {
      let nonZeroValues = 0;// 紀錄多少詞
      const termCount = {};//單個文本有的少詞。"詞1": 詞頻(詞出現次數)

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

      termFrequencyMatrix.rowPtr.push(
        termFrequencyMatrix.rowPtr[termFrequencyMatrix.rowPtr.length - 1] +
          nonZeroValues
      );
 
      termFrequencyMatrix.id.push(new ObjectId(doc._id));
   
    });
//     console.log(termFrequencyMatrix.id.length); 
//     console.log(termFrequencyMatrix.rowPtr.length);
//     return { termsIndex, termFrequencyMatrix };
    return termFrequencyMatrix;
  }
}
class CosineSimilarityCalculator {
  constructor(sparseMatrix) {
    this.sparseMatrix = sparseMatrix;
  }
//   getIndex(id){
//       const rowIndex = this.sparseMatrix.id.indexOf(id);
//       return rowIndex
//   }
    getIndex(id) {
        const idStr = id.toString();
        const rowIndex = this.sparseMatrix.id.findIndex((element) => element.toString() === idStr);
        return rowIndex;
    }

  getRow(id) {
    const rowIndex = this.sparseMatrix.id.indexOf(id);
//     console.log('rowIndex:', rowIndex);
    if (rowIndex== (-1)){
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

  getSimilarityList(targetId) {
    const targetRow = this.getRow(targetId);
//     console.log('targetRow', targetRow);
    return;
    const similarities = [];

    for (let i = 0; i < this.sparseMatrix.id.length; i++) {
      if (this.sparseMatrix.id[i] === targetId) {
        continue;
      }
//       console.log('this.sparseMatrix.id[i]', typeof(this.sparseMatrix.id[i]));//new ObjectId("64149fcf6aad9611e1c793ad")//object
      const otherRow = this.getRow(this.sparseMatrix.id[i]);
      const similarity = this.cosineSimilarity(targetRow, otherRow);

      if (similarity > 0.01) {
        similarities.push({
          id: this.sparseMatrix.id[i],
          similarity,
        });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }
}

async function main() { 
    let startTime, endTime;
    startTime = performance.now();
    const builder = new TermFrequencyMatrixBuilder();//If it is open in the front, please close it here
    await builder.connect();
    
    try {
        const sparseMatrix = await builder.getDocuments(
          'sample_event_DB',
          'TermFrequencyMatrix2'
        );
//         console.log('sparseMatrix :', sparseMatrix );
        let targetId
         targetId = new ObjectId("64149fcf6aad9611e1c77884"); //object
        
        const calculator = new CosineSimilarityCalculator(sparseMatrix[0]);
//         console.log('calculator.getIndex(targetId)',calculator.getIndex(targetId))
        //Get the end time
        endTime = performance.now();

        //The difference is how many milliseconds it took to call myFunction()
        console.debug('Elapsed time:', (endTime - startTime));
    } catch (error) {
        console.error(error);
    } finally {
        await builder.client.close();
    }
}

main();