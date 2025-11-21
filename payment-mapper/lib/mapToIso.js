const fs = require("fs");
const path = require("path");

const mappingFile = path.join(__dirname, "../config/isoMapping.json");
let mappingConfig = JSON.parse(fs.readFileSync(mappingFile, "utf8"));

function mapToIso(resp) {
  for (const rule of mappingConfig.mappings) {
    if (rule.match.status !== undefined && resp.status === rule.match.status) {
      return rule.iso;
    }

    if (rule.match.message_contains) {
      const msg = (resp.message || "").toLowerCase();
      if (msg.includes(rule.match.message_contains.toLowerCase())) {
        return rule.iso;
      }
    }
  }

  return mappingConfig.default; // unknown = 96
}

module.exports = { mapToIso };
