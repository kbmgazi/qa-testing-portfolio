const express = require("express");
const app = express();

app.use(express.json());

// ISO response mapping (your custom table)
const cardResponseMapping = {
  "5425233430109903": "00",   // Success
  "4000000000001000": "51",   // Insufficient funds
  "4347699988887770": "96",   // General processing error
  "4000160000004140": "98",   // Refund failed
  "4009830000001980": "61",   // Limit exceeded
  "4242420000000090": "54",   // Expired card
  "5114610000004770": "43",   // Lost or stolen
  "5121220000006920": "R1"    // High risk error
};

// Description mapping (optional but nice)
const isoDescriptions = {
  "00": "Success",
  "51": "Insufficient funds",
  "96": "System malfunction",
  "98": "Refund failed",
  "61": "Limit exceeded",
  "54": "Expired card",
  "43": "Lost or stolen card",
  "R1": "High risk transaction"
};

// Helper function
function getIsoCodeForCard(cardNumber) {
  return cardResponseMapping[cardNumber] || "05"; // default: Do Not Honor
}

// Payment Simulation Endpoint
app.post("/simulate-payment", (req, res) => {
  const { card_number, amount } = req.body;

  if (!card_number || !amount) {
    return res.status(400).json({
      error: "card_number and amount are required"
    });
  }

  const isoCode = getIsoCodeForCard(card_number);

  return res.json({
    amount,
    card_number,
    iso_code: isoCode,
    description: isoDescriptions[isoCode],
    approved: isoCode === "00"
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`ISO Payment Simulator running on port ${PORT}`);
});
