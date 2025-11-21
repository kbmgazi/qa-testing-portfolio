const express = require("express");
const app = express();
app.use(express.json());

// -------------------------
// CONSTANTS
// -------------------------
const VALID_TOKEN = "sk_test_1234567890";

const AUTH_MIDDLEWARE = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (header !== `Bearer ${VALID_TOKEN}`) {
        return res.status(401).json({ status: "error", message: "Invalid API token" });
    }
    next();
};

// -------------------------
// REFUND STORE
// -------------------------
let REFUNDS = {
    "RFD_1001": {
        id: "RFD_1001",
        transaction_id: "TXN_9001",
        amount: 15000,
        currency: "ZAR",
        status: "needs-attention",
        account_number: "7654321098",
        bank_id: "9",
        retry_count: 0
    },
    "RFD_1002": {
        id: "RFD_1002",
        transaction_id: "TXN_9002",
        amount: 25000,
        currency: "ZAR",
        status: "success",
        account_number: "8888888888",
        bank_id: "9",
        retry_count: 0
    },
    "RFD_1003": {
        id: "RFD_1003",
        transaction_id: "TXN_9003",
        amount: 18000,
        currency: "ZAR",
        status: "needs-attention",
        account_number: "1234567890",
        bank_id: "9",
        retry_count: 0
    }
};

// -------------------------
// GET /refund  → List refunds
// -------------------------
app.get("/refund", AUTH_MIDDLEWARE, (req, res) => {
    return res.status(200).json({
        status: "success",
        refunds: Object.values(REFUNDS)
    });
});

// -------------------------
// POST /refund/:id/retry
// -------------------------
app.post("/refund/:id/retry", AUTH_MIDDLEWARE, (req, res) => {
    const { id } = req.params;

    if (!REFUNDS[id]) {
        return res.status(404).json({ status: "error", message: "Refund ID not found" });
    }

    const refund = REFUNDS[id];

    // If refund is already success → NOT RETRYABLE
    if (refund.status !== "needs-attention") {
        return res.status(400).json({ status: "error", message: "Refund not retryable" });
    }

    // If tried before → NOT RETRYABLE
    if (refund.retry_count >= 1) {
        return res.status(400).json({ status: "error", message: "Refund not retryable" });
    }

    const { refund_account_details } = req.body;

    if (!refund_account_details) {
        return res.status(400).json({ status: "error", message: "Missing refund account details" });
    }

    // Update values (mapping the account number)
    refund.account_number = refund_account_details.account_number;
    refund.bank_id = refund_account_details.bank_id || "9";
    refund.currency = "ZAR";
    refund.status = "success";
    refund.retry_count += 1;

    return res.status(200).json({
        status: "success",
        message: "Refund processed successfully",
        refund
    });
});

// -------------------------
// POST /refund/retry_with_customer_details/:id
// -------------------------
app.post("/refund/retry_with_customer_details/:id", AUTH_MIDDLEWARE, (req, res) => {
    const { id } = req.params;

    if (!REFUNDS[id]) {
        return res.status(404).json({ status: "error", message: "Refund ID not found" });
    }

    const refund = REFUNDS[id];

    // Refund not retryable
    if (refund.status !== "needs-attention" || refund.retry_count >= 1) {
        return res.status(400).json({ status: "error", message: "Refund not retryable" });
    }

    const { refund_account_details } = req.body;

    if (!refund_account_details) {
        return res.status(400).json({ status: "error", message: "Missing refund account details" });
    }

    // Update using customer details
    refund.account_number = refund_account_details.account_number;
    refund.bank_id = refund_account_details.bank_id || "9";
    refund.currency = "ZAR";
    refund.status = "success";
    refund.retry_count += 1;

    return res.status(200).json({
        status: "success",
        message: "Refund retry successful",
        refund
    });
});

// -------------------------
// START SERVER
// -------------------------
app.listen(3003, () => {
    console.log("Refund Mock Server running at http://localhost:3003");
});
