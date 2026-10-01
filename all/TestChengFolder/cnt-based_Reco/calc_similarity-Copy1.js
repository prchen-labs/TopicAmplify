const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
const { dot } = require('mathjs');
const { cosine } = require('vectorious');

class SimilarityCalculator {
  constructor(uri) {
    this.client = new MongoClient(uri, { useUnifiedTopology: true });
  }

  async connect() {
    await this.client.connect();
  }

  async getDocumentById(collection, id) {
    return await collection.findOne({ _id: ObjectId(id) });
  }

  async getDocuments(collection) {
    return await collection.find().toArray();
  }

  calculateWordFrequency(words) {
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    return frequency;
  }

  async cosineSimilarity(id) {
    const db = this.client.db('sample_event_DB');
    const collection = db.collection('Samp_evt_Coll_featureWords');

    const targetDoc = await this.getDocumentById(collection, id);
    if (!targetDoc) throw new Error('Document not found');

    const targetVector = this.calculateWordFrequency(targetDoc.TitleAndDESC);

    const documents = await this.getDocuments(collection);
    const similarities = [];
    let conterFor = 0;
    for (const doc of documents) {
      if (conterFor==1) break;
      conterFor=conterFor+1
      if (doc._id.equals(targetDoc._id)) continue;

      const docVector = this.calculateWordFrequency(doc.TitleAndDESC);
      const dotProduct = dot(targetVector, docVector);//?need to modify
      const similarity = cosine(dotProduct);//?
      console.log("similarity:\n",similarity)
      similarities.push({ document: doc, similarity });
    }

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }
}

async function main() {
  const calculator = new SimilarityCalculator('mongodb://localhost:27017');
  await calculator.connect();

  try {
    const similarityList = await calculator.cosineSimilarity('64149fcf6aad9611e1c77894');
    console.log("similarityList:\n",similarityList);
  } catch (error) {
    console.error("error:\n",error);
  } finally {
    await calculator.client.close();
  }
}

main();
