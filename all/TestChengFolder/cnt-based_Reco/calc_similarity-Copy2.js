const MongoClient = require('mongodb').MongoClient;

class TermFrequencyMatrixBuilder {
  constructor(uri = 'mongodb://127.0.0.1:27017') {
    this.client = new MongoClient(uri);
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
    const termFrequencies = {};

    documents.forEach(doc => {
      doc.TitleAndDESC.forEach(term => {
        termFrequencies[term] = (termFrequencies[term] || 0) + 1;
      });
    });

    const termFrequencyMatrix = [];

    documents.forEach(doc => {
      const termCount = {};

      doc.TitleAndDESC.forEach(term => {
        termCount[term] = (termCount[term] || 0) + 1;
      });

      Object.keys(termCount).forEach(term => {
        termFrequencyMatrix.push({
          _id: doc._id,
          term,
          frequency: termCount[term],
        });
      });
    });

    return termFrequencyMatrix;
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

async function main() {
  // Replace TermFrequencyMatrixBuilder with the actual implementation
  const builder = new TermFrequencyMatrixBuilder();
  await builder.connect();
  const termFrequencyMatrix = await builder.buildTermFrequencyMatrix(
    'sample_event_DB',
    'Samp_evt_Coll_featureWords'
  );
  await builder.client.close();

  const storage = new MongoDBStorage();
  await storage.connect();

  try {
    await storage.storeData(
      'sample_event_DB',
      'TermFrequencyMatrix',
      termFrequencyMatrix
    );
  } catch (error) {
    console.error(error);
  } finally {
    await storage.client.close();
  }
}

main();
