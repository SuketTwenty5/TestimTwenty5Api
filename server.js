// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(cors());

// Middleware to handle CORS headers
app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Import the get-messages route
const getMessagesRoute = require('./routes/getMessages');
const collectStepDataRoutes = require('./routes/collectStepData');

// Use the get-messages route without any prefix
app.use('/', getMessagesRoute);
app.use('/', collectStepDataRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
});
