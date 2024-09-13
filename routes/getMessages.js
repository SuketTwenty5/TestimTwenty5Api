// routes/getMessages.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Define the /get-messages endpoint
router.post('/get-messages', async (req, res) => {
    const { from } = req.body;

    if (!from) {
        return res.status(400).json({ error: 'From number is required' });
    }

    try {
        // Make a request to the Twilio API to get messages
        const response = await axios.get('https://api.twilio.com/2010-04-01/Accounts/AC13f92c5dc04d6abb1a10a4b18d6ffcc4/Messages.json', {
            params: {
                From: from
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic QUMxM2Y5MmM1ZGMwNGQ2YWJiMWExMGE0YjE4ZDZmZmNjNDo5N2JmNzg5YjZjZDI4NGFjNmU4ZDk3OTJkN2MyNGZkZg==' // Replace with your encoded credentials
            }
        });
        // Send the response data back to the client
        res.json(response.data);
    } catch (error) {
        // Handle errors and send a 500 status code if an error occurs
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
