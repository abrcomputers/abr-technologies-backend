const express  = require('express');
const router   = express.Router();
const { Resend } = require('resend');
const supabase = require('../lib/supabase');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/contact
 * Accepts the enquiry form, saves to DB, sends email notification
 *
 * Body: { name, organisation, email, phone, interest, message }
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, organisation, email, phone, interest, message } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    const errors = [];
    if (!name    || name.trim().length < 2)     errors.push('Name is required (min 2 characters).');
    if (!email   || !isValidEmail(email))        errors.push('A valid email address is required.');
    if (!message || message.trim().length < 10)  errors.push('Message is required (min 10 characters).');
    if (phone && !isValidIndianPhone(phone))      errors.push('Please enter a valid Indian phone number.');

    if (errors.length) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    const enquiry = {
      name:         name.trim(),
      organisation: organisation?.trim() || null,
      email:        email.trim().toLowerCase(),
      phone:        phone?.trim() || null,
      interest:     interest || 'Not specified',
      message:      message.trim(),
      created_at:   new Date().toISOString(),
      status:       'new',
    };

    // ── Save to Supabase ────────────────────────────────────────────────────
    const { error: dbError } = await supabase
      .from('enquiries')
      .insert([enquiry]);

    if (dbError) {
      console.error('DB insert error:', dbError.message);
      // Don't block the user — still try to send the email
    }

    // ── Send notification email to ABR team ─────────────────────────────────
    await resend.emails.send({
      from:    process.env.CONTACT_EMAIL_FROM,
      to:      process.env.CONTACT_EMAIL_TO,
      subject: `New Enquiry: ${enquiry.interest} — ${enquiry.name}`,
      html: buildAdminEmail(enquiry),
    });

    // ── Send confirmation email to customer ─────────────────────────────────
    await resend.emails.send({
      from:    process.env.CONTACT_EMAIL_FROM,
      to:      enquiry.email,
      subject: 'We received your enquiry — ABR Technologies',
      html: buildCustomerEmail(enquiry),
    });

    return res.json({
      success: true,
      message: 'Your enquiry has been received. Our team will contact you within 24 hours.',
    });

  } catch (err) {
    next(err);
  }
});

// ── Email templates ───────────────────────────────────────────────────────────

function buildAdminEmail(e) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#00c6ff;border-bottom:2px solid #00c6ff;padding-bottom:8px">
        New Website Enquiry — ABR Technologies
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        ${row('Name',          e.name)}
        ${row('Organisation',  e.organisation || '—')}
        ${row('Email',         `<a href="mailto:${e.email}">${e.email}</a>`)}
        ${row('Phone',         e.phone || '—')}
        ${row('Interested In', e.interest)}
        ${row('Submitted At',  new Date(e.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST')}
      </table>
      <div style="margin-top:20px;padding:16px;background:#f4f7fb;border-radius:8px">
        <strong>Message:</strong>
        <p style="margin-top:8px;white-space:pre-wrap">${e.message}</p>
      </div>
      <p style="margin-top:24px;font-size:12px;color:#888">
        Sent automatically by the ABR Technologies website contact form.
      </p>
    </div>`;
}

function buildCustomerEmail(e) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#00c6ff">Thank you, ${e.name.split(' ')[0]}!</h2>
      <p>We have received your enquiry about <strong>${e.interest}</strong> and our team will get back to you within <strong>24 business hours</strong>.</p>
      <div style="margin:20px 0;padding:16px;background:#f4f7fb;border-radius:8px">
        <strong>Your message:</strong>
        <p style="margin-top:8px;white-space:pre-wrap;color:#555">${e.message}</p>
      </div>
      <p>For urgent inquiries, you can also reach us at:</p>
      <ul>
        <li>📧 <a href="mailto:enquiry@abrtechnologies.in">enquiry@abrtechnologies.in</a></li>
        <li>📞 +91 98765 43210</li>
        <li>💬 <a href="https://wa.me/919876543210">WhatsApp</a></li>
      </ul>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="font-size:12px;color:#888">
        ABR Technologies Private Limited · Chennai, Tamil Nadu, India<br>
        Make in India | GeM OEM | BIS Certified
      </p>
    </div>`;
}

function row(label, value) {
  return `
    <tr style="border-bottom:1px solid #eee">
      <td style="padding:10px 8px;font-weight:600;color:#555;width:140px">${label}</td>
      <td style="padding:10px 8px;color:#222">${value}</td>
    </tr>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidIndianPhone(phone) {
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  return /^(91)?[6-9]\d{9}$/.test(cleaned);
}

module.exports = router;
