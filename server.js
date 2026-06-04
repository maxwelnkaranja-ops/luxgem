const express = require('express');
const path = require('path');
const axios = require('axios'); // Add axios for API calls
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Daraja API Config (Hardcoded for now as requested from your read file)
const MPESA_CONFIG = {
  CONSUMER_KEY: 'ro2d07DvIlfmFNhbb9S0j7ACIajvJMI5i4m9CsQ7H2xwu2Ld',
  CONSUMER_SECRET: 'saKzFAqt2ecb6y5tC5P813EomwwJnby7fSSMBDqxTM5CXwBh4MqAldP5QxlUVAJG',
  BUSINESS_SHORT_CODE: '174379',
  PASSKEY: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  CALLBACK_URL: 'https://gewerly.onrender.com/api/callback', // Change to your actual Render URL
  ENVIRONMENT: 'sandbox'
};

const BASE_URL = 'https://sandbox.safaricom.co.ke';

// Get Access Token
async function getAccessToken() {
    const credentials = Buffer.from(`${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`).toString('base64');
    try {
        const response = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: { 'Authorization': `Basic ${credentials}` }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// STK Push Endpoint
app.post('/api/stkpush', async (req, res) => {
    const { phoneNumber, amount, orderId } = req.body;
    try {
        const accessToken = await getAccessToken();
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const password = Buffer.from(`${MPESA_CONFIG.BUSINESS_SHORT_CODE}${MPESA_CONFIG.PASSKEY}${timestamp}`).toString('base64');

        // Sanitize phone
        let phone = phoneNumber.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '254' + phone.slice(1);
        else if (phone.startsWith('7') || phone.startsWith('1')) phone = '254' + phone;

        const payload = {
            BusinessShortCode: MPESA_CONFIG.BUSINESS_SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: Math.round(amount),
            PartyA: phone,
            PartyB: MPESA_CONFIG.BUSINESS_SHORT_CODE,
            PhoneNumber: phone,
            CallBackURL: MPESA_CONFIG.CALLBACK_URL,
            AccountReference: orderId,
            TransactionDesc: `Payment for Order ${orderId}`
        };

        const response = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        res.json(response.data);
    } catch (error) {
        console.error('STK Push Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to initiate STK Push' });
    }
});

// Callback endpoint (for Safaricom to send payment results)
app.post('/api/callback', (req, res) => {
    console.log('M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));
    res.json({ ResultCode: 0, ResultDesc: "Success" });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
