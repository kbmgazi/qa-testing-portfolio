const cardData = require("../config/cardMapping.json");

// Extract card lookup table
const cardMap = cardData.cards;
const descriptions = cardData.descriptions;

// Get ISO code from card number
function getIsoFromCard(cardNumber) {
  return cardMap[cardNumber] || "05"; // fallback: Do Not Honor
}

// Get description text
function getIsoDescription(isoCode) {
  return descriptions[isoCode] || "Unknown error";
}

module.exports = { getIsoFromCard, getIsoDescription };
