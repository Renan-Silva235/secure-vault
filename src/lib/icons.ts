// Map service names to colors
const serviceColors: Record<string, string> = {
  gmail: '#EA4335',
  google: '#4285F4',
  instagram: '#E4405F',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  x: '#000000',
  linkedin: '#0A66C2',
  github: '#333333',
  netflix: '#E50914',
  spotify: '#1DB954',
  amazon: '#FF9900',
  apple: '#555555',
  microsoft: '#00A4EF',
  santander: '#EC0000',
  bradesco: '#CC092F',
  itau: '#003399',
  nubank: '#820AD1',
  whatsapp: '#25D366',
  telegram: '#26A5E4',
  discord: '#5865F2',
  steam: '#1B2838',
  paypal: '#003087',
};

export function getServiceColor(name: string): string {
  const key = name.toLowerCase().trim();
  for (const [k, v] of Object.entries(serviceColors)) {
    if (key.includes(k)) return v;
  }
  // Generate consistent color from name
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 50%)`;
}

export function getServiceInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}
