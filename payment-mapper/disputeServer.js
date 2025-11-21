// disputeServer.js
const express = require('express');
const app = express();
app.use(express.json());

// Mock data
let disputes = [
  {
    id: 2867,
    refund_amount: null,
    currency: "NGN",
    status: "pending",
    resolution: null,
    domain: "test",
    transaction: {
      id: 2867,
      domain: "test",
      status: "success",
      reference: "asjck8gf76zd1dr",
      amount: 39100,
      gateway_response: "Successful",
      paid_at: "2017-11-09T00:01:56.000Z",
      created_at: "2017-11-09T00:01:36.000Z",
      channel: "card",
      currency: "NGN",
      customer: { id: 10207, email: "shola@baddest.com" }
    },
    transaction_reference: null,
    customer: {
      id: 10207,
      email: "shola@baddest.com",
      customer_code: "CUS_unz4q52yjsd6064",
      risk_action: "default"
    },
    history: [{ status: "pending", by: "demo@test.co", createdAt: "2017-11-16T16:12:24.000Z" }],
    messages: [{ sender: "demo@test.co", body: "test this", createdAt: "2017-11-16T16:12:24.000Z" }],
    createdAt: "2017-11-16T16:12:24.000Z",
    updatedAt: "2019-08-16T08:05:25.000Z",
    evidence: [],
    attachments: []
  }
];

// ----------------- AUTH MIDDLEWARE -----------------
function checkAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({
      status: false,
      message: "Unauthorized: Missing token",
      type: "auth_error",
      code: "unauthorized"
    });
  }

  const token = auth.split(" ")[1];
  const validToken = "sk_test_1234567890"; // replace with your test token
  if (token !== validToken) {
    return res.status(401).json({
      status: false,
      message: "Unauthorized: Invalid token",
      type: "auth_error",
      code: "unauthorized"
    });
  }

  next();
}

// ----------------- DISPUTE ENDPOINTS -----------------
app.get('/dispute', checkAuth, (req, res) => {
  const { page = 1, perPage = 50 } = req.query;
  res.json({
    status: true,
    message: "Disputes retrieved",
    data: disputes,
    meta: { total: disputes.length, skipped: 0, perPage: Number(perPage), page: Number(page), pageCount: 1 }
  });
});

app.get('/dispute/:id', checkAuth, (req, res) => {
  const dispute = disputes.find(d => d.id === Number(req.params.id));
  if (!dispute) return res.status(404).json({ status: false, message: "Dispute not found" });
  res.json({ status: true, message: "Dispute retrieved", data: dispute });
});

app.get('/dispute/transaction/:id', checkAuth, (req, res) => {
  const transactionId = Number(req.params.id);
  const dispute = disputes.find(d => d.transaction.id === transactionId);
  if (!dispute) return res.status(404).json({ status: false, message: "No disputes found for transaction" });
  res.json({ status: true, message: "Dispute retrieved successfully", data: dispute });
});

app.put('/dispute/:id', checkAuth, (req, res) => {
  const dispute = disputes.find(d => d.id === Number(req.params.id));
  if (!dispute) return res.status(404).json({ status: false, message: "Dispute not found" });

  const { refund_amount } = req.body;
  if (refund_amount) {
    dispute.refund_amount = refund_amount;
    dispute.status = "resolved";
    dispute.resolution = "merchant-accepted";
  }
  res.json({ status: true, message: "Dispute updated successfully", data: [dispute] });
});

// ----------------- ADD EVIDENCE -----------------
app.post('/dispute/:id/evidence', checkAuth, (req, res) => {
  const dispute = disputes.find(d => d.id === Number(req.params.id));
  if (!dispute) return res.status(404).json({ status: false, message: "Dispute not found" });

  const { customer_email, type, name, url } = req.body;

  // Validation
  if (!customer_email) {
    return res.status(400).json({
      status: false,
      message: "Validation error: customer_email is required",
      type: "validation_error",
      code: "bad_request"
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer_email)) {
    return res.status(400).json({
      status: false,
      message: "Validation error: invalid email format",
      type: "validation_error",
      code: "bad_request"
    });
  }

  if (!type || !name || !url) {
    return res.status(400).json({
      status: false,
      message: "Validation error: type, name, and url are required",
      type: "validation_error",
      code: "bad_request"
    });
  }

  const evidenceId = dispute.evidence.length + 1;
  const evidence = { id: evidenceId, customer_email, type, name, url, createdAt: new Date().toISOString() };
  dispute.evidence.push(evidence);

  return res.json({ status: true, message: "Evidence created", data: evidence });
});

// ----------------- GET URL ENDPOIT -----------------
app.get('/dispute/:id/upload_url', checkAuth, (req, res) => {
  const dispute = disputes.find(d => d.id === Number(req.params.id));
  if (!dispute) return res.status(404).json({ status: false, message: "Dispute not found" });

  const { upload_filename } = req.query;

  // Validate missing filename
  if (!upload_filename) {
    return res.status(400).json({
      status: false,
      message: "Validation error: upload_filename is required",
      type: "validation_error",
      code: "bad_request"
    });
  }

  // Validate format: letters, numbers, dash, underscore, single dot, and extension must be ".ext"
  const filenameRegex = /^[a-zA-Z0-9_-]+\.ext$/;
  if (!filenameRegex.test(upload_filename)) {
    return res.status(400).json({
      status: false,
      message: "Validation error: filename must only contain letters, numbers, -, _ and have .ext extension",
      type: "validation_error",
      code: "bad_request"
    });
  }

  res.json({
    status: true,
    message: "Upload url generated",
    data: {
      signedUrl: `https://mockstorage.com/${upload_filename}?mock_signed=true`,
      fileName: upload_filename
    }
  });
});

// ----------------- RESOLVE DISPUTE ENDPOIT -----------------
app.put('/dispute/:id/resolve', checkAuth, (req, res) => {
  const dispute = disputes.find(d => d.id === Number(req.params.id));
  if (!dispute) return res.status(404).json({ status: false, message: "Dispute not found" });

  const { resolution, message, uploaded_filename, refund_amount } = req.body;

  // 1. Validate resolution
  const validResolutions = ["approved", "declined", "merchant-accepted"];
  if (!resolution) {
    return res.status(400).json({
      status: false,
      message: "Validation error: resolution is required",
      type: "validation_error",
      code: "bad_request"
    });
  }
  if (!validResolutions.includes(resolution)) {
    return res.status(400).json({
      status: false,
      message: `Validation error: resolution must be one of ${validResolutions.join(", ")}`,
      type: "validation_error",
      code: "bad_request"
    });
  }

  // 2. Validate message
  if (!message) {
    return res.status(400).json({
      status: false,
      message: "Validation error: message is required",
      type: "validation_error",
      code: "bad_request"
    });
  }

  // 3. Validate refund_amount
  if (refund_amount === undefined || refund_amount === null) {
    return res.status(400).json({
      status: false,
      message: "Validation error: refund_amount is required",
      type: "validation_error",
      code: "bad_request"
    });
  }
  if (!Number.isInteger(refund_amount)) {
    return res.status(400).json({
      status: false,
      message: "Validation error: refund_amount must be an integer",
      type: "validation_error",
      code: "bad_request"
    });
  }

  // 4. Validate uploaded_filename
  const filenameRegex = /^[a-zA-Z0-9_-]+\.[a-z]+$/; // alphanumeric + _ or - + extension
  if (!uploaded_filename || !filenameRegex.test(uploaded_filename)) {
    return res.status(400).json({
      status: false,
      message: "Validation error: uploaded_filename is invalid",
      type: "validation_error",
      code: "bad_request"
    });
  }

  // All validations passed, update dispute
  dispute.resolution = resolution;
  dispute.status = "resolved";
  dispute.refund_amount = refund_amount;

  res.json({
    status: true,
    message: "Dispute successfully resolved",
    data: dispute
  });
    // Invalid Dispute ID
  if (!dispute) {
    return res.status(404).json({
      status: false,
      message: "Dispute not found",
      type: "validation_error",
      code: "not_found"
    });
  }

  const { customer_email, type, name, url } = req.body;

  // Missing customer_email
  if (!customer_email) {
    return res.status(400).json({
      status: false,
      message: "Validation error: customer_email is required",
      type: "validation_error",
      code: "bad_request"
    });
  }

  // Invalid email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer_email)) {
    return res.status(400).json({
      status: false,
      message: "Validation error: invalid email format",
      type: "validation_error",
      code: "bad_request"
    });
  }

  // Validate type, name, url
  if (!type || !name || !url) {
    return res.status(400).json({
      status: false,
      message: "Validation error: type, name, and url are required",
      type: "validation_error",
      code: "bad_request"
    });
  }

  // All validations passed → create evidence
  const evidenceId = dispute.evidence.length + 1;
  const evidence = { id: evidenceId, customer_email, type, name, url, createdAt: new Date().toISOString() };
  dispute.evidence.push(evidence);

  return res.status(200).json({
    status: true,
    message: "Evidence linked successfully",
    data: evidence
  });
});

app.get('/dispute/export', checkAuth, (req, res) => {
  if (disputes.length === 0) return res.status(404).json({ status: false, message: "Dispute not found" });

  res.json({
    status: true,
    message: "Export successful",
    data: {
      path: "https://mockstorage.com/exports/disputes.csv",
      expiresAt: new Date(Date.now() + 60000).toISOString()
    }
  });
});

// ----------------- METHOD NOT ALLOWED -----------------
app.all('/dispute', (req, res, next) => {
  if (req.method !== 'GET') return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  next();
});

app.all('/dispute/:id', (req, res, next) => {
  if (!['GET','PUT'].includes(req.method)) return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  next();
});

app.all('/dispute/:id/evidence', (req, res, next) => {
  if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  next();
});

app.all('/dispute/:id/resolve', (req, res, next) => {
  if (req.method !== 'PUT') return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  next();
});

app.all('/dispute/export', (req, res, next) => {
  if (req.method !== 'GET') return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  next();
});

// ----------------- START SERVER -----------------
const PORT = 3001;
app.listen(PORT, () => console.log(`Mock Dispute server running on http://localhost:${PORT}`));
