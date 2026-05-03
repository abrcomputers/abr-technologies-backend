const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');

/**
 * GET /api/warranty/:serial
 * Looks up a warranty record by serial number
 *
 * Response (found, active):
 *   { found: true, status: "Active", product: "ABR CorePro i5",
 *     expiry: "December 2025", purchaseDate: "December 2022",
 *     customer: "Ravi Kumar", supportEmail: "support@abrtechnologies.in" }
 *
 * Response (not found):
 *   { found: false }
 */
router.get('/:serial', async (req, res, next) => {
  try {
    const serial = req.params.serial.trim().toUpperCase();

    // Validate format: ABR-XXXXX (letters/numbers after dash)
    if (!/^ABR-[A-Z0-9]{2,10}$/.test(serial)) {
      return res.status(400).json({
        error: 'Invalid serial number format. Expected format: ABR-XXXXX',
      });
    }

    const { data, error } = await supabase
      .from('warranties')
      .select(`
        serial_number,
        status,
        product_name,
        purchase_date,
        expiry_date,
        customer_name,
        model_number
      `)
      .eq('serial_number', serial)
      .single();

    if (error || !data) {
      return res.json({ found: false });
    }

    // Determine if warranty is currently active
    const now        = new Date();
    const expiryDate = new Date(data.expiry_date);
    const isActive   = expiryDate > now && data.status === 'Active';

    return res.json({
      found:        true,
      status:       isActive ? 'Active' : 'Expired',
      product:      data.product_name,
      model:        data.model_number,
      customer:     data.customer_name,
      purchaseDate: formatDate(data.purchase_date),
      expiry:       formatDate(data.expiry_date),
      supportEmail: 'support@abrtechnologies.in',
    });

  } catch (err) {
    next(err);
  }
});

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString('en-IN', {
    month: 'long',
    year:  'numeric',
  });
}

module.exports = router;
