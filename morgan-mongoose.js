const morgan = require('morgan');
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URL);
client.connect();

const mongoLogger = async (req, res, next) => {
        try {
        const db = client.db('logs');
        const collection = db.collection('requests');
        await collection.insertOne({
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            timestamp: new Date()
        });
        } catch (err) {
        console.error(err);
        }
    
        next();
    };
    
    module.exports = mongoLogger