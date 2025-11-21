// verificationMockServer.js
const express = require("express");
const app = express();
app.use(express.json());

// ----------------------
// MOCK BANKS
// ----------------------
const mockBanks = {
  "063": "Access Bank",
  "632005": "ABSA ZA",
  "001": "Mock Bank ZA"
};

// ----------------------
// MOCK ACCOUNTS PER BANK
// ----------------------
const mockAccounts = {
  "063": {
    "0022728151": { account_name: "Mgazi Enterprise", account_number: "0022728151" }
  },
  "632005": {
    "0123456789": { account_name: "Ann Bron", account_number: "0123456789" }
  }
};

// ----------------------
// GET /bank/verify
// ----------------------
app.get("/bank/verify", (req, res) => {
  const { account_number, bank_code } = req.query;

  if (!account_number || !bank_code) {
    return res.status(400).json({
      status: false,
      message: "Missing account_number or bank_code",
      type: "validation_error"
    });
  }

  if (!mockBanks[bank_code]) {
    return res.status(400).json({
      status: false,
      message: "Could not resolve account name. Check parameters or try again.",
      meta: {
        nextStep:
          "Ensure that you're passing the correct bank code. Use the List Banks Endpoint to get the list of all available banks and their corresponding bank codes"
      },
      type: "validation_error",
      code: "invalid_bank_code"
    });
  }

  if (!mockAccounts[bank_code] || !mockAccounts[bank_code][account_number]) {
    return res.status(400).json({
      status: false,
      message: "Account number not found for this bank",
      type: "validation_error",
      code: "account_not_found"
    });
  }

  return res.status(200).json({
    status: true,
    message: "Account resolved",
    data: mockAccounts[bank_code][account_number]
  });
});

// ----------------------
// POST /bank/validate
// ----------------------
app.post("/bank/validate", (req, res) => {
  const {
    bank_code,
    country_code,
    account_number,
    account_name,
    account_type,
    document_type,
    document_number
  } = req.body;

  // Validate required fields
  if (
    !bank_code ||
    !country_code ||
    !account_number ||
    !account_name ||
    !account_type ||
    !document_type ||
    !document_number
  ) {
    return res.status(400).json({
      status: false,
      message: "Missing required validation fields",
      type: "validation_error"
    });
  }

  // Validate bank
  if (!mockBanks[bank_code]) {
    return res.status(400).json({
      status: false,
      message: "Invalid bank code",
      code: "invalid_bank_code"
    });
  }

  // Validate account
  const bankAccounts = mockAccounts[bank_code];
  if (!bankAccounts || !bankAccounts[account_number]) {
    return res.status(400).json({
      status: false,
      message: "Account not found",
      code: "account_not_found"
    });
  }

  // Validate account name matches
  if (bankAccounts[account_number].account_name !== account_name) {
    return res.status(400).json({
      status: false,
      message: "Account name does not match bank records",
      code: "account_name_mismatch"
    });
  }

  // SUCCESS RESPONSE
  return res.status(200).json({
    status: true,
    message: "Account validated successfully",
    data: {
      bank_code,
      country_code,
      account_number,
      account_name,
      account_type,
      document_type,
      document_number
    }
  });
});

// ----------------------
// START SERVER
// ----------------------
app.listen(5005, () => {
  console.log("Mock Verification & Validation API running on port 5005");
});
