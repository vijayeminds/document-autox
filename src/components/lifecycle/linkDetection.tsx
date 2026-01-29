// Auto-detect potential document links based on matching criteria

const LINK_TYPE_MAP = {
  "PO-ASN": "PO_ASN",
  "ASN-BOL": "ASN_BOL",
  "BOL-POD": "BOL_POD",
  "POD-Invoice": "POD_Invoice",
  "PO-Invoice": "PO_Invoice",
};

export function detectDocumentLinks(documents, existingLinks = []) {
  const suggestions = [];

  // Create a set of existing link pairs for quick lookup
  const existingPairs = new Set(
    existingLinks.map((l) => `${l.source_document_id}-${l.target_document_id}`)
  );

  // Define document flow order
  const flowOrder = {
    PO: 1,
    ASN: 2,
    BOL: 3,
    POD: 4,
    Invoice: 5,
  };

  // Group by vendor for efficiency
  const docsByVendor = {};
  documents.forEach((doc) => {
    if (!docsByVendor[doc.vendor]) {
      docsByVendor[doc.vendor] = [];
    }
    docsByVendor[doc.vendor].push(doc);
  });

  // For each vendor, find potential links
  Object.entries(docsByVendor).forEach(([vendor, vendorDocs]) => {
    // Sort by document type order
    const sortedDocs = vendorDocs.sort(
      (a, b) =>
        (flowOrder[a.document_type] || 99) - (flowOrder[b.document_type] || 99)
    );

    // Check consecutive document types
    for (let i = 0; i < sortedDocs.length - 1; i++) {
      const sourceDoc = sortedDocs[i];

      for (let j = i + 1; j < sortedDocs.length; j++) {
        const targetDoc = sortedDocs[j];

        // Skip if link already exists
        const linkKey1 = `${sourceDoc.id}-${targetDoc.id}`;
        const linkKey2 = `${targetDoc.id}-${sourceDoc.id}`;
        if (existingPairs.has(linkKey1) || existingPairs.has(linkKey2)) {
          continue;
        }

        // Determine link type
        const linkTypeKey = `${sourceDoc.document_type}-${targetDoc.document_type}`;
        const linkType = LINK_TYPE_MAP[linkTypeKey];

        if (!linkType) continue;

        // Calculate match confidence
        const matchResult = calculateMatchConfidence(sourceDoc, targetDoc);

        if (matchResult.confidence >= 60) {
          suggestions.push({
            sourceDoc,
            targetDoc,
            linkType,
            confidence: matchResult.confidence,
            reason: matchResult.reason,
          });
        }
      }
    }
  });

  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

function calculateMatchConfidence(doc1, doc2) {
  let confidence = 0;
  const reasons = [];

  // Same vendor (required baseline)
  if (doc1.vendor === doc2.vendor) {
    confidence += 40;
  } else {
    return { confidence: 0, reason: "Different vendors" };
  }

  // Reference number similarity
  if (doc1.reference_number && doc2.reference_number) {
    const ref1Parts = doc1.reference_number.split(/[-_]/);
    const ref2Parts = doc2.reference_number.split(/[-_]/);

    const hasCommonPart = ref1Parts.some((p1) =>
      ref2Parts.some((p2) => p1 === p2 && p1.length > 2)
    );

    if (hasCommonPart) {
      confidence += 25;
      reasons.push("Reference numbers share common identifier");
    }
  }

  // Date proximity (within 30 days)
  if (doc1.document_date && doc2.document_date) {
    const date1 = new Date(doc1.document_date);
    const date2 = new Date(doc2.document_date);
    const daysDiff = Math.abs((date2 - date1) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 30) {
      confidence += 15;
      if (daysDiff <= 7) {
        confidence += 10;
        reasons.push(`Documents dated ${Math.round(daysDiff)} days apart`);
      }
    } else {
      reasons.push(
        `Documents dated ${Math.round(daysDiff)} days apart - may be unrelated`
      );
    }
  }

  // Amount matching (within 10% for related docs, exact for PO-Invoice)
  if (doc1.total_amount && doc2.total_amount) {
    const amountDiff = Math.abs(doc1.total_amount - doc2.total_amount);
    const percentDiff =
      (amountDiff / Math.max(doc1.total_amount, doc2.total_amount)) * 100;

    if (percentDiff < 1) {
      confidence += 20;
      reasons.push("Amounts match exactly");
    } else if (percentDiff < 10) {
      confidence += 10;
      reasons.push(`Amounts within ${percentDiff.toFixed(1)}%`);
    } else if (doc2.document_type === "BOL" || doc2.document_type === "POD") {
      // BOL/POD might have different amounts (shipping costs)
      confidence += 5;
      reasons.push("Amount variance expected for shipping documents");
    } else {
      reasons.push(`Amount variance: ${percentDiff.toFixed(1)}%`);
    }
  }

  return {
    confidence: Math.min(confidence, 100),
    reason: reasons.join("; ") || "Based on vendor and document type sequence",
  };
}
