const RECIPIENT = "jhudson@iconx.io";

function clean(value, max = 5000) {
  return String(value || "").trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}


async function saveLeadToSupabase(lead) {
  const supabaseUrl = clean(process.env.SUPABASE_URL, 500).replace(/\/$/, "");
  const secretKey = clean(process.env.SUPABASE_SECRET_KEY, 1000);

  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/iconx_leads`, {
    method: "POST",
    headers: {
      "apikey": secretKey,
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(lead)
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Supabase insert error:", result);
    throw new Error("The inquiry could not be saved.");
  }

  return Array.isArray(result) ? result[0] : result;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const body = req.body || {};
  if (body.website) return res.status(200).json({ ok: true });

  const inquiry = clean(body.inquiry, 8000);
  const summary = body.summary || {};

  const name = clean(summary.name, 150) || "Not provided";
  const email = clean(summary.email, 250) || "Not provided";
  const company = clean(summary.company, 250) || "Not provided";
  const heardAbout = clean(summary.heardAbout, 500) || "Not provided";
  const interest = clean(summary.interest, 200) || "Not specified";
  const linkedin = clean(summary.linkedin, 500) || "Not provided";
  const geography = clean(summary.geography, 500) || null;
  const retailerOrChannel = clean(summary.retailerOrChannel, 500) || null;
  const productCategory = clean(summary.productCategory, 300) || null;
  const businessStage = clean(summary.businessStage, 300) || null;
  const campaignTiming = clean(summary.campaignTiming, 300) || null;
  const budgetOrScale = clean(summary.budgetOrScale, 300) || null;

  if (!inquiry) {
    return res.status(400).json({ error: "Please tell us who you are and what you want to do." });
  }
  if (email === "Not provided") {
    return res.status(400).json({ error: "Please include your email address in the prompt so we can follow up." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please include a valid email address in the prompt." });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Email delivery has not been configured yet." });
  }

  const submittedAt = new Date().toISOString();

  const aiSummary = [
    `Name: ${name}`,
    `Company: ${company}`,
    `Interest: ${interest}`,
    geography ? `Geography: ${geography}` : null,
    retailerOrChannel ? `Retailer or channel: ${retailerOrChannel}` : null,
    productCategory ? `Product category: ${productCategory}` : null,
    businessStage ? `Business stage: ${businessStage}` : null,
    heardAbout !== "Not provided" ? `Source: ${heardAbout}` : null,
    `Request: ${inquiry}`
  ].filter(Boolean).join("\n");

  const searchText = [
    name,
    email,
    company,
    interest,
    linkedin,
    heardAbout,
    geography,
    retailerOrChannel,
    productCategory,
    businessStage,
    campaignTiming,
    budgetOrScale,
    inquiry
  ].filter(Boolean).join(" | ");

  let savedLead;
  try {
    savedLead = await saveLeadToSupabase({
      full_name: name === "Not provided" ? null : name,
      email,
      company: company === "Not provided" ? null : company,
      linkedin_url: linkedin === "Not provided" ? null : linkedin,
      interest,
      geography,
      retailer_or_channel: retailerOrChannel,
      product_category: productCategory,
      business_stage: businessStage,
      campaign_timing: campaignTiming,
      budget_or_scale: budgetOrScale,
      heard_about_us: heardAbout === "Not provided" ? null : heardAbout,
      original_prompt: inquiry,
      ai_summary: aiSummary,
      lead_status: "new",
      priority: "unreviewed",
      search_text: searchText
    });
  } catch (error) {
    console.error(error);
    return res.status(502).json({
      error: "Your inquiry could not be saved. Please try again."
    });
  }
  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#172033">
      <h1 style="font-size:24px;margin-bottom:6px">New Iconx.io website inquiry</h1>
      <p style="color:#667085;margin-top:0">Submitted ${escapeHtml(submittedAt)}</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold;width:190px">Name</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">Email</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">Company / Brand</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(company)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">How they heard about us</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(heardAbout)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">Interest</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(interest)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">LinkedIn</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(linkedin)}</td></tr>
      </table>
      <h2 style="font-size:18px">What they want to do</h2>
      <div style="white-space:pre-wrap;background:#f6f8fb;border:1px solid #e5e7eb;border-radius:12px;padding:18px">${escapeHtml(inquiry)}</div>
    </div>`;

  const fromAddress = process.env.CONTACT_FROM_EMAIL || "Iconx.io Website <website@iconx.io>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [RECIPIENT],
        reply_to: email,
        subject: `Iconx.io inquiry: ${interest} — ${name}${company !== "Not provided" ? ` / ${company}` : ""}`,
        html: emailHtml
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Resend error:", result);
      return res.status(502).json({ error: "Email delivery failed. Please try again." });
    }
    return res.status(200).json({ ok: true, email_id: result.id, lead_id: savedLead?.id || null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to send the inquiry right now." });
  }
};
