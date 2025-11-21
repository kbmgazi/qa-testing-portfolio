const express = require("express");
const bodyParser = require("body-parser");

// Internal modules
const { callPaystackInitialize } = require("./lib/callPaystack");
const { mapToIso } = require("./lib/mapToIso");
const { getIsoFromCard, getIsoDescription } = require("./lib/mapCardIso");

const app = express();
app.use(bodyParser.json());

// ============================
// MAIN API
// ============================
app.post("/initialize-payment", async (req, res) => {
  try {
    const { card_number } = req.body;
    let paystackResp;

    // ============================================================
    // 1️⃣ SIMULATION MODE (if card number matches test card database)
    // ============================================================
    if (card_number) {
      const isoCode = getIsoFromCard(card_number);
      const status = isoCode === "00"; // success only if ISO = 00

      // Generate simulation references
      const fakeReference = "sim-" + Math.random().toString(36).substring(2, 10);
      const fakeAccessCode = "sim-" + Math.random().toString(36).substring(2, 10);

      paystackResp = {
        status: status, // dynamic success/failure
        message: status ? "Authorization URL created" : "Transaction failed",
        data: {
          authorization_url: status
            ? `https://checkout.paystack.com/${fakeAccessCode}`
            : null,
          access_code: status ? fakeAccessCode : null,
          reference: fakeReference
        }
      };

      return res.json({
        simulation: true,
        iso_response_code: isoCode,
        iso_message: getIsoDescription(isoCode),
        approved: status,
        original: paystackResp
      });
    }

    // ============================================================
    // 2️⃣ REAL PAYSTACK CALL (when card is not in your ISO test list)
    // ============================================================
    paystackResp = await callPaystackInitialize(req.body);

    // Convert Paystack result to ISO 8583
    const isoCode = mapToIso(paystackResp);

    return res.json({
      simulation: false,
      iso_response_code: isoCode,
      iso_message: getIsoDescription(isoCode),
      approved: isoCode === "00",
      original: paystackResp
    });

  } catch (error) {
    return res.status(400).json({
      error: "Paystack call failed",
      details: error.message
    });
  }
});

// ============================
// SERVER
// ============================
app.listen(3000, () => console.log("Server running on port 3000"));
