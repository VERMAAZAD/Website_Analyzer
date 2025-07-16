const mongoose = require('mongoose');

const mongo_URL = process.env.MONGO_CONN;

mongoose.connect(mongo_URL)
    .then(() => {
        console.log('MongoDB is connnect');
    }).catch((err) => {
        console.log('Server is Not Connect' + err);
    })