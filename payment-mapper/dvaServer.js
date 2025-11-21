// mockDvaServer.js
const express = require('express');
const app = express();
app.use(express.json());

// ----------------------
// Configuration
// ----------------------
const PORT = 3000;
const AUTH_TOKEN = "sk_test_1234567890";

// Supported banks
const SUPPORTED_BANKS = [
  { code: "343", name: "ABSA" },
  { code: "655", name: "FNB" },
  { code: "710", name: "CAPITEC" },
];

// Mock storage
let dvas = 0;
let assignments = [];

// Generate unique DVA ID
const generateDvaId = () => `DVA_${Date.now()}`;

// ----------------------
// Authorization Middleware
// ----------------------
function checkAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ status: false, message: "Unauthorized: Missing token" });
  }
  const token = auth.split(" ")[1];
  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ status: false, message: "Unauthorized: Invalid token" });
  }
  next();
}

// ----------------------
// Create DVA
// ----------------------
app.post('/dedicated_account', checkAuth, (req, res) => {
  const { customer_id, bank_code } = req.body;

  // Missing customer ID
  if (!customer_id) {
    return res.status(400).json({ status: false, message: "Missing customer information" });
  }

  // Missing bank_code
  if (!bank_code) {
    return res.status(400).json({ status: false, message: "Missing bank_code" });
  }

  // Unsupported bank_code
  const bank = SUPPORTED_BANKS.find(b => b.code === bank_code);
  if (!bank) {
    return res.status(400).json({ status: false, message: "Unsupported bank" });
  }

  const newDVA = {
    id: generateDvaId(),
    account_number: String(Math.floor(1000000000 + Math.random() * 9000000000)),
    bank: bank.name,
    customer: { id: customer_id }
  };

  dvas.push(newDVA);

  return res.json({
    status: true,
    message: "DVA created successfully",
    data: newDVA
  });
});

// ----------------------
// Assign DVA
// ----------------------
app.post('/dedicated_account/assign', checkAuth, (req, res) => {
  const { dva_id, customer_id, email, first_name, last_name } = req.body;

  // Must provide dva_id & customer_id or full customer info
  if ((!dva_id || !customer_id) && !(email && first_name && last_name)) {
    return res.status(400).json({ status: false, message: "dva_id and customer_id are required" });
  }

  // Assignment using DVA ID & customer ID
  if (dva_id && customer_id) {
    const dva = dvas.find(d => d.id === dva_id);
    if (!dva) return res.status(404).json({ status: false, message: "DVA not found" });

    // Ensure DVA is assigned only once
    if (assignments.find(a => a.dva_id === dva_id)) {
      return res.status(409).json({ status: false, message: "DVA already assigned" });
    }

    assignments.push({ dva_id, customer_id });
    return res.json({
      status: true,
      message: "DVA assigned successfully",
      data: { dedicated_account: dva_id, customer: { id: customer_id } }
    });
  }

  // Assignment using full customer info
  const mockDvaId = generateDvaId();
  const mockCustomerId = String(Math.floor(100000000 + Math.random() * 900000000));

  const newDVA = {
    id: mockDvaId,
    account_number: String(Math.floor(1000000000 + Math.random() * 9000000000)),
    bank: SUPPORTED_BANKS[0].name,
    customer: { id: mockCustomerId, email, first_name, last_name }
  };

  dvas.push(newDVA);
  assignments.push({ dva_id: mockDvaId, customer_id: mockCustomerId });

  return res.json({
    status: true,
    message: "DVA assigned successfully",
    data: { dedicated_account: mockDvaId, customer: { id: mockCustomerId, email, first_name, last_name } }
  });
});

// ----------------------
// List all DVAs
// ----------------------
app.get('/dedicated_account', checkAuth, (req, res) => {
  return res.json({
    status: true,
    message: "List of Dedicated Virtual Accounts",
    data: dvas.length > 0 ? dvas : []  // return empty array if no DVAs exist
  });
});

// ----------------------
// Unsupported methods
// ----------------------
app.all('/dedicated_account', (req, res, next) => {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }
  next();
});

app.all('/dedicated_account/assign', (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }
  next();
});

// ----------------------
// Start server
// ----------------------
app.listen(PORT, () => console.log(`Mock DVA server running on http://localhost:${PORT}`));
