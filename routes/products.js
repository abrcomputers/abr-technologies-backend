const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');

/**
 * GET /api/products?type=desktop&brand=intel&use=office
 * Returns filtered product list from Supabase
 * Falls back to static data if DB unreachable
 */
router.get('/', async (req, res, next) => {
  try {
    const { type, brand, use } = req.query;

    let query = supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (type)  query = query.eq('type', type);    // desktop | workstation
    if (brand) query = query.eq('brand', brand);  // intel | amd
    if (use)   query = query.eq('use_case', use); // office | creative | enterprise | cad | render | data

    const { data, error } = await query;

    if (error) throw error;

    return res.json({ products: data || [] });

  } catch (err) {
    // Graceful fallback to static data so the site never breaks
    console.error('Products DB error, using fallback:', err.message);
    return res.json({ products: FALLBACK_PRODUCTS, source: 'fallback' });
  }
});

/**
 * GET /api/products/:id
 * Returns a single product by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .eq('active', true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product: data });
  } catch (err) {
    next(err);
  }
});

// ── Fallback static data (matches your current frontend data) ─────────────────
const FALLBACK_PRODUCTS = [
  { id:'d1', type:'desktop',     name:'ABR CorePro i5',    brand:'intel', use_case:'office',     processor:'Intel Core i5-13400',  ram:'8GB DDR4',      storage:'512GB SSD',      price:'₹32,999',   c1:'#00c6ff', c2:'#4db8ff' },
  { id:'d2', type:'desktop',     name:'ABR CorePro i7',    brand:'intel', use_case:'creative',   processor:'Intel Core i7-13700',  ram:'16GB DDR4',     storage:'1TB SSD',        price:'₹52,999',   c1:'#00c6ff', c2:'#7b5ea7' },
  { id:'d3', type:'desktop',     name:'ABR CoreElite i9',  brand:'intel', use_case:'enterprise', processor:'Intel Core i9-13900',  ram:'32GB DDR5',     storage:'2TB NVMe',       price:'₹89,999',   c1:'#4db8ff', c2:'#00c6ff' },
  { id:'d4', type:'desktop',     name:'ABR RyzenEdge 5',   brand:'amd',   use_case:'office',     processor:'AMD Ryzen 5 7600',     ram:'8GB DDR5',      storage:'512GB NVMe',     price:'₹29,999',   c1:'#ff6b6b', c2:'#ff9a3c' },
  { id:'d5', type:'desktop',     name:'ABR RyzenEdge 7',   brand:'amd',   use_case:'creative',   processor:'AMD Ryzen 7 7700X',    ram:'16GB DDR5',     storage:'1TB NVMe',       price:'₹49,999',   c1:'#ff6b6b', c2:'#a78bfa' },
  { id:'d6', type:'desktop',     name:'ABR RyzenMax 9',    brand:'amd',   use_case:'enterprise', processor:'AMD Ryzen 9 7900X',    ram:'64GB DDR5',     storage:'4TB NVMe',       price:'₹1,09,999', c1:'#ff9a3c', c2:'#ff6b6b' },
  { id:'w1', type:'workstation', name:'ABR ProStation i7', brand:'intel', use_case:'cad',        processor:'Intel Core i7-13700K', ram:'32GB DDR5 ECC', storage:'1TB NVMe',       price:'₹79,999',   c1:'#00c6ff', c2:'#4db8ff' },
  { id:'w2', type:'workstation', name:'ABR ProStation i9', brand:'intel', use_case:'render',     processor:'Intel Core i9-13900K', ram:'64GB DDR5 ECC', storage:'2TB NVMe',       price:'₹1,39,999', c1:'#4db8ff', c2:'#7b5ea7' },
  { id:'w3', type:'workstation', name:'ABR XeonForge W5',  brand:'intel', use_case:'data',       processor:'Intel Xeon W5-3425',   ram:'128GB DDR5 ECC',storage:'4TB NVMe RAID',  price:'₹2,89,999', c1:'#00c6ff', c2:'#a78bfa' },
  { id:'w4', type:'workstation', name:'ABR ThreadStation',  brand:'amd',  use_case:'render',     processor:'AMD Threadripper 7960X',ram:'128GB DDR5 ECC',storage:'4TB NVMe',      price:'₹3,49,999', c1:'#ff6b6b', c2:'#ff9a3c' },
  { id:'w5', type:'workstation', name:'ABR RyzenPro 9 WX', brand:'amd',   use_case:'cad',        processor:'AMD Ryzen 9 Pro 7945', ram:'64GB DDR5 ECC', storage:'2TB NVMe',       price:'₹1,69,999', c1:'#ff6b6b', c2:'#a78bfa' },
  { id:'w6', type:'workstation', name:'ABR EpycCore 9',    brand:'amd',   use_case:'data',       processor:'AMD EPYC 9224',        ram:'256GB DDR5 ECC',storage:'8TB NVMe RAID',  price:'₹5,49,999', c1:'#ff9a3c', c2:'#ff6b6b' },
];

module.exports = router;
