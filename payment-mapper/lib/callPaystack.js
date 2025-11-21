const axios = require("axios");

async function callPaystackInitialize(body) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    body,
    {
      headers: {
        Authorization: `Bearer sk_test_036ff57c9ce1e640ec7f9a2b66906da1da8489ab`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data; // paystack response
}

module.exports = { callPaystackInitialize };
