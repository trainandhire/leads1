require('dotenv').config();
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');


const app = express();
const port = process.env.PORT || 4000;

// Enter the Page Access Token from the previous step
const FACEBOOK_PAGE_ACCESS_TOKEN = 'EAAEnkjLu0M4BOwWd225Q8lbDZBjR5C5EMqS4pi2yW2WByMWiYnNgyNWaARxSRWtmz0fkUZAuppS4roI0R35cXZBqlSoPfuEdSb6aLfzfyI8d135c8aWGRE2XGI9XXC4seUSMCMe54hYnGZCtONV6UXv6hZA1B4iNaenqY2LMSi63ZBvYpRV8d52KiM8wZDZD';

// Accept JSON POST body
app.use(bodyParser.json());

app.get('/', (req, res)=>{``
    res.send("hlo")
})

// GET /webhook
app.get('/webhooks', (req, res) => {
    console.log("entered ")
    // Facebook sends a GET request
    // To verify that the webhook is set up
    // properly, by sending a special challenge that
    // we need to echo back if the "verify_token" is as specified
    console.log("***",req.query['hub.verify_token']);
    console.log("***",req.query['hub.verify_token'] === 'CUSTOM_WEBHOOK_VERIFY_TOKEN');
    if (req.query['hub.verify_token'] === 'CUSTOM_WEBHOOK_VERIFY_TOKEN') {
        res.send(req.query['hub.challenge']);
        return;
    }
})

// POST /webhook
app.post('/webhooks', async (req, res) => {
    console.log("IN POST WEBHOOK");
    // Facebook will be sending an object called "entry" for "leadgen" webhook event
    if (!req.body.entry) {
        return res.status(500).send({ error: 'Invalid POST data received' });
    }

    // Travere entries & changes and process lead IDs
    console.log("inpost",req.body.entry)
    for (const entry of req.body.entry) {
        for (const change of entry.changes) {
            // Process new lead (leadgen_id)
            console.log("change",change);
            await processNewLead(change.value.leadgen_id);
        }
    }

    // Success
    res.send({ success: true });
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});

// Process incoming leads
async function processNewLead(leadId) {
    let response;

    try {
        // Get lead details by lead ID from Facebook API
        response = await axios.get(`https://graph.facebook.com/v9.0/${leadId}/?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`);
    }
    catch (err) {
        // Log errors
        return console.warn(`An invalid response was received from the Facebook API:`, err.response.data ? JSON.stringify(err.response.data) : err.response);
    }

    // Ensure valid API response returned
    if (!response.data || (response.data && (response.data.error || !response.data.field_data))) {
        return console.warn(`An invalid response was received from the Facebook API: ${response}`);
    }

    // Lead fields
    const leadForm = [];

    // Extract fields
    for (const field of response.data.field_data) {
        // Get field name & value
        const fieldName = field.name;
        const fieldValue = field.values[0];

        // Store in lead array
        leadForm.push(`${fieldName}: ${fieldValue}`);
    }

    // Implode into string with newlines in between fields
    const leadInfo = leadForm.join('\n');

    // Log to console
    console.log('A new lead was received!\n', leadInfo);

    // Use a library like "nodemailer" to notify you about the new lead
    // 
    // Send plaintext e-mail with nodemailer
    // transporter.sendMail({
    //     from: `Admin <admin@example.com>`,
    //     to: `You <you@example.com>`,
    //     subject: 'New Lead: ' + name,
    //     text: new Buffer(leadInfo),
    //     headers: { 'X-Entity-Ref-ID': 1 }
    // }, function (err) {
    //     if (err) return console.log(err);
    //     console.log('Message sent successfully.');
    // });
}