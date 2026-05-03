const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');

router.get('/:serial', async (req, res, next) => {
  try {
    const serial = req.params.serial.trim().toUpperCase();

    if (!/^ABR-[A-Z0-9]{2,10}$/.test(serial)) {
      return res.status(400).json({
        error: 'Invalid serial number format. Expected format: ABR-XXXXX',
      });
    }

    const { data, error } = await supabase
      .from('warranties')
      .select('*')
      .eq('serial_number', serial)
      .single();

    if (error || !data) {
      return res.json({ found: false });
    }

    const now        = new Date();
    const expiryDate = new Date(data.expiry_date);
    const isActive = expiryDate > now;

    return res.json({
      found:        true,
      status:       isActive ? 'Active' : 'Expired',
      product:      data.product_name,
      model:        data.model_number,
      customer:     data.customer_name,
      purchaseDate: new Date(data.purchase_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
expiry:       new Date(data.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      supportEmail: 'support@abrcomputers.in',
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
