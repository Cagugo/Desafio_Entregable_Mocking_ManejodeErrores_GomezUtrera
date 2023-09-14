const mongoose = require('mongoose');
const { db, persistence } = require('../config');
mongoose.set('debug', false);
mongoose.set('strictQuery', false);

let Dao;

switch (persistence) {
  case 'MONGO':
    let connection;
    mongoose.connect(db.mongo_atlas, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: db.dbName,
    });
    connection = mongoose.connection;
    connection.on('connected', () => {
    });
    const DaoMongo = require('./mongo/dao.mongo');
    Dao = DaoMongo;
    console.log('Successful connection to MONGO Factory persistence');
    break;

  case 'MEMORY':
    const DaoMemory = require('./memory/dao.memory');
    Dao = DaoMemory;
    console.log('Successful connection to persistence MEMORY Factory');
    break;

  case 'FILESYSTEM':
    const DaoFileSystem = require('./filesystem/dao.fylesystem');
    Dao = DaoFileSystem;
    console.log('Successful connection to persistence FILESYSTEM Factory');
    break;

  default:
    throw new Error('Persistence is not supported');
}

module.exports = Dao;
