function clean(value, max = 5000) {
  return String(value || "").trim().slice(0, max);
}

function getAdminKey(req) {
  return clean(req.headers["x-admin-key"] || req.headers["X-Admin-Key"], 1000);
}

function isAuthorized(req) {
  const expected = clean(process.env.ADMIN_PASSWORD, 1000);
  const received = getAdminKey(req);
  return Boolean(expected && received && expected === received);
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 500).replace(/\/$/, "");
  const key = clean(process.env.SUPABASE_SECRET_KEY, 1000);
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return { url, key };
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let result = null;
  try { result = text ? JSON.parse(text) : null; } catch { result = text; }

  if (!response.ok) {
    console.error("Supabase admin API error:", response.status, result);
    throw new Error("Database request failed.");
  }
  return result;
}

function normalize(value) {
  return clean(value, 10000).toLowerCase();
}

function tokenize(value) {
  return normalize(value)
    .replace(/[^a-z0-9@.\s-]/g, " ")
    .split(/\s+/)
    .filter(token => token.length > 2);
}

function parseQuery(query) {
  const q = normalize(query);
  const filters = {};

  if (q.includes("sampling") && (q.includes("endcap") || q.includes("retail activation"))) {
    filters.interest = "sampling and endcaps";
  } else if (q.includes("sampling") || q.includes("sample")) {
    filters.interest = "sampling";
  } else if (q.includes("endcap") || q.includes("retail activation")) {
    filters.interest = "endcaps";
  }

  const geographies = [
    "southern california", "northern california", "california", "arizona",
    "florida", "texas", "new york", "los angeles", "san diego", "phoenix",
    "tucson", "miami", "chicago", "national", "nationwide"
  ];
  filters.geography = geographies.find(item => q.includes(item)) || null;

  const categories = [
    "beverage", "hydration", "snack", "food", "beauty", "wellness",
    "alcohol", "cpg", "consumer product", "supplement"
  ];
  filters.product_category = categories.find(item => q.includes(item)) || null;

  if (q.includes("new lead") || q.includes("new leads")) filters.lead_status = "new";
  if (q.includes("contacted")) filters.lead_status = "contacted";
  if (q.includes("qualified")) filters.lead_status = "qualified";
  if (q.includes("closed")) filters.lead_status = "closed";
  if (q.includes("high priority")) filters.priority = "high";
  if (q.includes("medium priority")) filters.priority = "medium";
  if (q.includes("low priority")) filters.priority = "low";

  return filters;
}

function scoreLead(lead, query, filters) {
  const q = normalize(query);
  const tokens = tokenize(query);
  const fields = [
    lead.full_name, lead.email, lead.company, lead.linkedin_url,
    lead.interest, lead.geography, lead.retailer_or_channel,
    lead.product_category, lead.business_stage, lead.campaign_timing,
    lead.budget_or_scale, lead.heard_about_us, lead.original_prompt,
    lead.ai_summary, lead.search_text, lead.lead_status, lead.priority
  ].filter(Boolean).join(" | ").toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (fields.includes(token)) score += token.length >= 7 ? 4 : 2;
  }

  if (filters.interest && normalize(lead.interest).includes(filters.interest)) score += 20;
  if (filters.geography && fields.includes(filters.geography)) score += 18;
  if (filters.product_category && fields.includes(filters.product_category)) score += 14;
  if (filters.lead_status && normalize(lead.lead_status) === filters.lead_status) score += 12;
  if (filters.priority && normalize(lead.priority) === filters.priority) score += 10;

  if (q.includes("recent") || q.includes("latest") || q.includes("newest")) {
    const ageDays = (Date.now() - new Date(lead.created_at).getTime()) / 86400000;
    score += Math.max(0, 10 - ageDays);
  }

  return score;
}

function buildAnswer(query, leads) {
  if (!leads.length) {
    return `No leads matched “${query}”. Try a broader phrase such as “all sampling leads” or “California endcaps.”`;
  }

  const companies = leads.map(l => l.company).filter(Boolean);
  const interests = [...new Set(leads.map(l => l.interest).filter(Boolean))];
  const geographies = [...new Set(leads.map(l => l.geography).filter(Boolean))];
  const topNames = leads.slice(0, 5).map(l => l.full_name || l.company || l.email).filter(Boolean);

  const parts = [
    `Found ${leads.length} matching lead${leads.length === 1 ? "" : "s"}.`,
    topNames.length ? `Top matches: ${topNames.join(", ")}.` : "",
    interests.length ? `Interests represented: ${interests.join(", ")}.` : "",
    geographies.length ? `Geographies represented: ${geographies.join(", ")}.` : "",
    companies.length ? `${new Set(companies).size} compan${new Set(companies).size === 1 ? "y" : "ies"} represented.` : ""
  ].filter(Boolean);

  return parts.join(" ");
}

module.exports = async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    if (req.method === "GET") {
      const limit = Math.min(Math.max(Number(req.query?.limit || 250), 1), 1000);
      const leads = await supabaseRequest(
        `iconx_leads?select=*&order=created_at.desc&limit=${limit}`
      );
      return res.status(200).json({ leads });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const action = clean(body.action, 100);

      if (action === "search") {
        const query = clean(body.query, 1500);
        const limit = Math.min(Math.max(Number(body.limit || 50), 1), 250);
        const allLeads = await supabaseRequest(
          `iconx_leads?select=*&order=created_at.desc&limit=1000`
        );

        const filters = parseQuery(query);
        const ranked = allLeads
          .map(lead => ({ lead, score: scoreLead(lead, query, filters) }))
          .filter(item => item.score > 0 || !query)
          .sort((a, b) => b.score - a.score || new Date(b.lead.created_at) - new Date(a.lead.created_at))
          .slice(0, limit)
          .map(item => ({ ...item.lead, _score: Math.round(item.score * 10) / 10 }));

        return res.status(200).json({
          query,
          filters,
          answer: buildAnswer(query, ranked),
          leads: ranked
        });
      }

      if (action === "update") {
        const id = clean(body.id, 100);
        if (!id) return res.status(400).json({ error: "Lead id is required." });

        const allowed = {};
        if (body.lead_status !== undefined) allowed.lead_status = clean(body.lead_status, 100);
        if (body.priority !== undefined) allowed.priority = clean(body.priority, 100);
        if (body.notes !== undefined) allowed.notes = clean(body.notes, 10000);
        allowed.updated_at = new Date().toISOString();

        const result = await supabaseRequest(
          `iconx_leads?id=eq.${encodeURIComponent(id)}&select=*`,
          {
            method: "PATCH",
            headers: { "Prefer": "return=representation" },
            body: JSON.stringify(allowed)
          }
        );
        return res.status(200).json({ lead: Array.isArray(result) ? result[0] : result });
      }

      return res.status(400).json({ error: "Unknown action." });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Admin request failed." });
  }
};
