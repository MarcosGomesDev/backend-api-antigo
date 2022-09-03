require('dotenv').config();

const mongoose = require('mongoose');

mongoose.connect(process.env.LOCAL_URL || process.env.URL)
    .then(() => {
        console.log('Database connected')
    })
    .catch((err) => console.log(err))