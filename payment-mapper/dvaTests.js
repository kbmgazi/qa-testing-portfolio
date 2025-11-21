// dvaTestsMock.js
const axios = require('axios');
const baseUrl = 'http://localhost:3000';
const validCustomerId = 320161482;
const unsupported = 558;

async function runDvaTests() {

    // -----------------------------
    // TC-DVA-001: Create a valid DVA
    // -----------------------------
    try {
        const res = await axios.post(`${baseUrl}/dedicated_account`, {
            customer_id: 'validCustomerId',
            bank: 'unsupported'
        });
        console.log("TC-DVA-001 Success:", res.data);
    } catch (err) {
        console.log("TC-DVA-001 Error:", err.response.data);
    }

    // -----------------------------
    // TC-DVA-002: Unsupported bank
    // -----------------------------
    try {
        const res = await axios.post(`${baseUrl}/dedicated_account`, {
            customer_id: 'validCustomerId',
            bank: 'unsupported'
        });
        console.log("TC-DVA-002 Success:", res.data);
    } catch (err) {
        console.log("TC-DVA-002 Error:", err.response.data);
    }

    // -----------------------------
    // TC-DVA-003: Missing customer
    // -----------------------------
    try {
        const res = await axios.post(`${baseUrl}/dedicated_account`, {
            bank: 'unsupported'
        });
        console.log("TC-DVA-003 Success:", res.data);
    } catch (err) {
        console.log("TC-DVA-003 Error:", err.response.data);
    }

    // -----------------------------
    // TC-DVA-004: Successful DVA assignment
    // -----------------------------
    try {
        // First, create a DVA
        const createRes = await axios.post(`${baseUrl}/dedicated_account/assign`, {
            email: "janedoe@test.com",
            first_name: "Jane",
            middle_name: "Karen",
            last_name: "Doe",
            phone: "+2348100000000",
            preferred_bank: "test-bank",
            country: "RSA"
        });
        const dvaId = createRes.data.data.id;
 
        // Assign the DVA
        const assignRes = await axios.post(`${baseUrl}/dedicated_account/assign`, {
            dva_id: dvaId,
            email: "janedoe@test.com",
            first_name: "Jane",
            middle_name: "Karen",
            last_name: "Doe",
            phone: "+2348100000000",
            preferred_bank: "test-bank",
            country: "RSA"
        });
        console.log("TC-DVA-004 Success:", assignRes.data);
    } catch (err) {
        console.log("TC-DVA-004 Error:", err.response.data);
    }

    // -----------------------------
    // TC-DVA-005: DVA already assigned
    // -----------------------------
    try {
        // Assign same DVA again
        const dvaId = 'DVA_already_assigned'; // Using mock ID for conflict
        const assignRes = await axios.post(`${baseUrl}/dedicated_account/assign`, {
            dva_id: dvaId,
            customer_id: 'validCustomerId'
        });
        console.log("TC-DVA-005 Success:", assignRes.data);
    } catch (err) {
        console.log("TC-DVA-005 Error:", err.response.data);
    }

    // -----------------------------
    // TC-DVA-006: Invalid DVA ID
    // -----------------------------
    try {
        const assignRes = await axios.post(`${baseUrl}/dedicated_account/assign`, {
            dva_id: 'DVA_invalid_id',
            customer_id: 'validCustomerId'
        });
        console.log("TC-DVA-006 Success:", assignRes.data);
    } catch (err) {
        console.log("TC-DVA-006 Error:", err.response.data);
    }
}

runDvaTests();
