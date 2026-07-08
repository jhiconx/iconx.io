const RECIPIENT = "jhudson@iconx.io";

function clean(value, max = 5000) {
  return String(value || "").trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const body = req.body || {};
  if (body.website) return res.status(200).json({ ok: true });

  const name = clean(body.name, 150);
  const email = clean(body.email, 250);
  const company = clean(body.company, 250) || "Not provided";
  const phone = clean(body.phone, 100) || "Not provided";
  const heardAbout = clean(body.heardAbout, 500) || "Not provided";
  const inquiry = clean(body.inquiry, 8000);
  const summary = body.summary || {};

  if (!name || !email || !inquiry) {
    return res.status(400).json({ error: "Name, email and your message are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Email delivery has not been configured yet." });
  }

  const interest = clean(summary.interest, 200) || "Not specified";
  const linkedin = clean(summary.linkedin, 500) || "Not provided";
  const submittedAt = new Date().toISOString();

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#172033">
      <h1 style="font-size:24px;margin-bottom:6px">New Iconx.io website inquiry</h1>
      <p style="color:#667085;margin-top:0">Submitted ${escapeHtml(submittedAt)}</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold;width:160px">Name</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">Email</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">Company / Brand</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(company)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">Phone</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(phone)}</td></tr>
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
    return res.status(200).json({ ok: true, id: result.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to send the inquiry right now." });
  }
};
