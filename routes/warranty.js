const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');

router.get('/:serial', async (req, res) => {
  try {
    const serial = req.params.serial.trim().toUpperCase();
    console.log('Serial received:', serial);

    // Test basic connection first
    const { data, error } = await supabase
      .from('warranties')
      .select('*')
      .limit(5);

    console.log('All warranties:', JSON.stringify(data));
    console.log('Error:', JSON.stringify(error));

    return res.json({ 
      serial,
      data, 
      error: error?.message 
    });

  } catch (err) {
    console.error('Catch error:', err.message);
    return res.json({ caught: err.message });
  }
});

module.exports = router;
