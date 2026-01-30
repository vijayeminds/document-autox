const axios = require("axios");

async function fetchDocument() {
  try {
    const response = await axios.get(
      "http://localhost:3000/api/v1/invoice/invoices",
    );
    const docs = response.data.data || [];

    const doc = docs.find((d) => d.po_id === "GT-US-2025-44589");

    if (doc) {
      console.log("=== DOCUMENT GT-US-2025-44589 ===\n");
      console.log("Document ID:", doc._id);
      console.log("PO Number:", doc.po_id);
      console.log("Bucket/Status:", doc.bucket_name);
      console.log("File URL:", doc.file_url);
      console.log("\n=== EXTRACTED JSON DATA ===\n");
      console.log(JSON.stringify(doc.extracted_json, null, 2));
    } else {
      console.log("Document not found");
      console.log("Total documents:", docs.length);
      console.log(
        "Sample PO IDs:",
        docs.slice(0, 10).map((d) => d.po_id),
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

fetchDocument();
