const RECIPIENT = "samples@iconx.io";

function clean(value, max = 5000) {
  return String(value || "").trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function cleanField(value) {
  return clean(value, 2000)
    .replace(/^[\s:;,.\-–—]+/, "")
    .replace(/[\s;]+$/g, "")
    .trim();
}

function stripKnownPrefixes(value) {
  return cleanField(value)
    .replace(/^(?:is|are|:|-)\s*/i, "")
    .replace(/^(?:yes|no)\s*[,.:;-]?\s*/i, "")
    .trim();
}

function getLines(text) {
  return clean(text, 10000)
    .split(/[\r\n]+/)
    .map(line => line.trim())
    .filter(Boolean);
}

function extractByPatterns(text, patterns, validator) {
  const lines = getLines(text);
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const value = stripKnownPrefixes(match[1]);
        if (value && (!validator || validator(value, line))) return value;
      }
    }
  }
  for (const pattern of patterns) {
    const match = clean(text, 10000).match(pattern);
    if (match && match[1]) {
      const value = stripKnownPrefixes(match[1]);
      if (value && (!validator || validator(value, clean(text, 10000)))) return value;
    }
  }
  return null;
}

function inferInterest(text) {
  const lower = clean(text, 10000).toLowerCase();
  const sampling = /\b(sampling|sample|samples|trial|demo|street team)\b/.test(lower);
  const endcaps = /\b(endcap|end cap|retail activation|in[-\s]?store display|display)\b/.test(lower);
  if (sampling && endcaps) return "Sampling and endcaps";
  if (sampling) return "Sampling";
  if (endcaps) return "Endcaps";
  return "Not specified";
}

function extractLinkedIn(text) {
  const match = clean(text, 10000).match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s,]+/i);
  return match ? match[0] : "Not provided";
}

function extractEmail(text) {
  const match = clean(text, 10000).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : "Not provided";
}

function validNameCandidate(value) {
  const lower = clean(value, 500).toLowerCase();
  if (/\b(interested|sampling|sample|endcap|email|company|brand|geography|retailer|channel|market|target|linkedin|phone|budget)\b/.test(lower)) return false;
  if (value.includes("@") || /^https?:\/\//i.test(value)) return false;
  return value.split(/\s+/).length <= 4;
}

function extractName(text) {
  const value = extractByPatterns(text, [
    /^(?:my\s+)?name\s*(?:is)?\s*:?\s*(.+)$/i,
    /^(?:i\s+am|i'm)\s+(.+)$/i
  ], validNameCandidate);
  return value || "Not provided";
}

function extractCompany(text) {
  const value = extractByPatterns(text, [
    /^(?:my\s+)?(?:company\s+or\s+brand|company\/brand|company|brand)\s*(?:is)?\s*:?\s*(.+)$/i,
    /^(?:i\s+work\s+(?:at|for)|we\s+are|we're)\s+(.+)$/i,
    /^(?:founder|owner)\s+(?:of|at)\s+(.+)$/i
  ], value => !value.includes("@") && !/^https?:\/\//i.test(value));
  return value || "Not provided";
}

function extractHeardAbout(text) {
  const value = extractByPatterns(text, [
    /^(?:how\s+(?:they|you)\s+heard\s+about\s+us|heard\s+about\s+us|source)\s*(?:is)?\s*:?\s*(.+)$/i,
    /(?:heard\s+about\s+(?:iconx\.io|you)|found\s+(?:iconx\.io|you))\s*(?:through|from|via|on|:)?\s*([^\.\n]+)/i,
    /referred\s+by\s+([^\.\n]+)/i
  ]);
  return value || "Not provided";
}

function extractGeography(text) {
  const value = extractByPatterns(text, [
    /^(?:the\s+)?geography(?:\s+i\s+want\s+to\s+target)?\s*(?:is)?\s*:?\s*(.+)$/i,
    /^(?:target\s+)?(?:market|region|city|state|geography)\s*(?:is)?\s*:?\s*(.+)$/i,
    /^(?:we\s+want\s+to\s+target|i\s+want\s+to\s+target|targeting)\s+(.+)$/i
  ]);
  if (value) return value;
  const match = clean(text, 10000).match(/\b(US|USA|United States|California|Arizona|Florida|Texas|New York|Los Angeles|San Diego|Phoenix|Tucson|Miami|National|Nationwide)\b/i);
  return match ? match[0] : null;
}

function extractRetailerOrChannel(text) {
  const value = extractByPatterns(text, [
    /^(?:my\s+)?(?:preferred\s+)?(?:retailer\s+or\s+channel|retailer\/channel)\s*(?:is)?\s*:?\s*(.+)$/i,
    /^(?:my\s+)?(?:preferred\s+)?(?:retailer|channel|stores?|grocery|campus|event)\s*(?:is|are|at|through)?\s*:?\s*(.+)$/i
  ]);
  return value ? value.replace(/^(?:or\s+channel\s*(?:is)?\s*:?\s*)/i, "").trim() : null;
}

function extractProductCategory(text) {
  const value = extractByPatterns(text, [
    /^(?:product\s+category|category)\s*(?:is)?\s*:?\s*(.+)$/i
  ]);
  if (value) return value;
  const categories = ["beverage", "hydration", "snack", "food", "beauty", "wellness", "alcohol", "cpg", "consumer product", "supplement"];
  const lower = clean(text, 10000).toLowerCase();
  return categories.find(category => lower.includes(category)) || null;
}

function extractBusinessStage(text) {
  const value = extractByPatterns(text, [
    /^(?:business\s+stage|stage)\s*(?:is)?\s*:?\s*(.+)$/i
  ]);
  if (value) return value;
  const lower = clean(text, 10000).toLowerCase();
  if (lower.includes("dtc") || lower.includes("direct-to-consumer")) return "DTC";
  if (lower.includes("startup") || lower.includes("emerging brand")) return "Emerging brand";
  if (lower.includes("established") || lower.includes("traditional brand")) return "Established brand";
  return null;
}

function buildSummary(inquiry, incomingSummary = {}) {
  const parsed = {
    name: extractName(inquiry),
    email: extractEmail(inquiry),
    company: extractCompany(inquiry),
    heardAbout: extractHeardAbout(inquiry),
    interest: inferInterest(inquiry),
    linkedin: extractLinkedIn(inquiry),
    geography: extractGeography(inquiry),
    retailerOrChannel: extractRetailerOrChannel(inquiry),
    productCategory: extractProductCategory(inquiry),
    businessStage: extractBusinessStage(inquiry),
    campaignTiming: null,
    budgetOrScale: null,
    inquiry
  };

  function pick(field, emptyValue = "Not provided") {
    const serverValue = clean(parsed[field], 2000);
    const clientValue = clean(incomingSummary[field], 2000);
    if (serverValue && serverValue !== emptyValue && serverValue !== "Not specified") return serverValue;
    if (clientValue && clientValue !== emptyValue && clientValue !== "Not specified") return clientValue;
    return serverValue || clientValue || emptyValue;
  }

  return {
    name: pick("name"),
    email: pick("email"),
    company: pick("company"),
    heardAbout: pick("heardAbout"),
    interest: pick("interest", "Not specified"),
    linkedin: pick("linkedin"),
    geography: clean(parsed.geography || incomingSummary.geography, 500) || null,
    retailerOrChannel: clean(parsed.retailerOrChannel || incomingSummary.retailerOrChannel, 500) || null,
    productCategory: clean(parsed.productCategory || incomingSummary.productCategory, 300) || null,
    businessStage: clean(parsed.businessStage || incomingSummary.businessStage, 300) || null,
    campaignTiming: clean(incomingSummary.campaignTiming, 300) || null,
    budgetOrScale: clean(incomingSummary.budgetOrScale, 300) || null,
    inquiry
  };
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 500).replace(/\/$/, "");
  const key = clean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, 2000);
  if (!url || !key) return null;
  return { url, key };
}

async function saveLeadToSupabase(lead) {
  const config = supabaseConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}/rest/v1/iconx_leads`, {
    method: "POST",
    headers: {
      "apikey": config.key,
      "Authorization": `Bearer ${config.key}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(lead)
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Supabase insert error:", response.status, result);
    throw new Error("Lead database insert failed.");
  }
  return Array.isArray(result) ? result[0] : result;
}

async function sendEmail({ submittedAt, summary, inquiry, savedLead }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Email delivery has not been configured yet.");
  }

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#172033">
      <h1 style="font-size:24px;margin-bottom:6px">New Iconx.io website inquiry</h1>
      <p style="color:#667085;margin-top:0">Submitted ${escapeHtml(submittedAt)}</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold;width:190px">Name</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(summary.name)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">Email</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(summary.email)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">Company / Brand</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(summary.company)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">How they heard about us</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(summary.heardAbout)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">Interest</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(summary.interest)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">Geography</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(summary.geography || "Not provided")}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">Retailer / Channel</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(summary.retailerOrChannel || "Not provided")}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">LinkedIn</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(summary.linkedin)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">Lead database</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${savedLead?.id ? `Saved: ${escapeHtml(savedLead.id)}` : "Email-only fallback"}</td></tr>
      </table>
      <h2 style="font-size:18px">What they want to do</h2>
      <div style="white-space:pre-wrap;background:#f6f8fb;border:1px solid #e5e7eb;border-radius:12px;padding:18px">${escapeHtml(inquiry)}</div>
    </div>`;

  const fromAddress = process.env.CONTACT_FROM_EMAIL || "Iconx.io Website <website@iconx.io>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [RECIPIENT],
      reply_to: summary.email,
      subject: `Iconx.io inquiry: ${summary.interest} — ${summary.name}${summary.company !== "Not provided" ? ` / ${summary.company}` : ""}`,
      html: emailHtml
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Resend error:", result);
    throw new Error("Email delivery failed. Please try again.");
  }
  return result;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  if (body.website) return res.status(200).json({ ok: true });

  const inquiry = clean(body.inquiry, 8000);
  if (!inquiry) {
    return res.status(400).json({ error: "Please tell us who you are and what you want to do." });
  }

  const summary = buildSummary(inquiry, body.summary || {});
  if (summary.email === "Not provided") {
    return res.status(400).json({ error: "Please include your email address in the prompt so we can follow up." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(summary.email)) {
    return res.status(400).json({ error: "Please include a valid email address in the prompt." });
  }

  const submittedAt = new Date().toISOString();
  const aiSummary = [
    `Name: ${summary.name}`,
    `Company: ${summary.company}`,
    `Interest: ${summary.interest}`,
    summary.geography ? `Geography: ${summary.geography}` : null,
    summary.retailerOrChannel ? `Retailer or channel: ${summary.retailerOrChannel}` : null,
    summary.productCategory ? `Product category: ${summary.productCategory}` : null,
    summary.businessStage ? `Business stage: ${summary.businessStage}` : null,
    summary.heardAbout !== "Not provided" ? `Source: ${summary.heardAbout}` : null,
    `Request: ${inquiry}`
  ].filter(Boolean).join("\n");

  const searchText = [
    summary.name,
    summary.email,
    summary.company,
    summary.interest,
    summary.linkedin,
    summary.heardAbout,
    summary.geography,
    summary.retailerOrChannel,
    summary.productCategory,
    summary.businessStage,
    summary.campaignTiming,
    summary.budgetOrScale,
    inquiry
  ].filter(Boolean).join(" | ");

  let savedLead = null;
  let databaseWarning = null;
  try {
    savedLead = await saveLeadToSupabase({
      full_name: summary.name === "Not provided" ? null : summary.name,
      email: summary.email,
      company: summary.company === "Not provided" ? null : summary.company,
      linkedin_url: summary.linkedin === "Not provided" ? null : summary.linkedin,
      interest: summary.interest,
      geography: summary.geography,
      retailer_or_channel: summary.retailerOrChannel,
      product_category: summary.productCategory,
      business_stage: summary.businessStage,
      campaign_timing: summary.campaignTiming,
      budget_or_scale: summary.budgetOrScale,
      heard_about_us: summary.heardAbout === "Not provided" ? null : summary.heardAbout,
      original_prompt: inquiry,
      ai_summary: aiSummary,
      lead_status: "new",
      priority: "unreviewed",
      search_text: searchText
    });
  } catch (error) {
    databaseWarning = error.message || "Lead database insert failed.";
    console.error("Lead database warning:", databaseWarning);
  }

  try {
    const emailResult = await sendEmail({ submittedAt, summary, inquiry, savedLead });
    return res.status(200).json({
      ok: true,
      email_id: emailResult.id || null,
      lead_id: savedLead?.id || null,
      database_saved: Boolean(savedLead?.id),
      database_warning: databaseWarning
    });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: error.message || "Unable to send the inquiry right now." });
  }
};
