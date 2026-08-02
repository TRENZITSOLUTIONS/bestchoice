// Mirrors the choices defined in backend/products/models.py
export const FABRIC_CHOICES = [
  { value: 'cotton', label: 'Cotton' },
  { value: 'linen', label: 'Linen' },
  { value: 'viscose', label: 'Viscose' },
  { value: 'denim', label: 'Denim' },
  { value: 'polyester', label: 'Polyester' },
  { value: 'rayon', label: 'Rayon' },
  { value: 'blend', label: 'Blend' },
  { value: 'others', label: 'Others' },
];

export const FIT_CHOICES = [
  { value: 'regular', label: 'Regular' },
  { value: 'slim', label: 'Slim' },
  { value: 'oversized', label: 'Oversized' },
  { value: 'relaxed', label: 'Relaxed' },
];

export const SLEEVE_TYPE_CHOICES = [
  { value: 'half_sleeve', label: 'Half Sleeve' },
  { value: 'full_sleeve', label: 'Full Sleeve' },
];

export const OCCASION_CHOICES = [
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'party', label: 'Party' },
  { value: 'ethnic', label: 'Ethnic' },
];

export const COLOR_SWATCHES = [
  { value: 'Black', hex: '#211726' },
  { value: 'Red', hex: '#e14b1f' },
  { value: 'Gold', hex: '#c98d20' },
  { value: 'Green', hex: '#3f6b4f' },
  { value: 'White', hex: '#fbf6ef' },
  { value: 'Blue', hex: '#2c3e50' },
];

export const PRICE_RANGES = [
  { label: 'Under ₹500', gte: undefined, lte: '500' },
  { label: '₹500 – ₹1,500', gte: '500', lte: '1500' },
  { label: '₹1,500 – ₹3,000', gte: '1500', lte: '3000' },
  { label: 'Above ₹3,000', gte: '3000', lte: undefined },
];
