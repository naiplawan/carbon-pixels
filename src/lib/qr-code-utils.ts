/**
 * QR Code generation utilities for Thailand Waste Diary
 * This is a simple implementation - in production, use a proper QR code library like qrcode.js
 */

export interface QRProfile {
  name: string;
  level: string;
  totalCredits: number;
  treesSaved: number;
  totalEntries: number;
  co2Impact: number;
  url: string;
}

/**
 * Generate a simple QR code pattern (placeholder implementation)
 * In production, replace this with a proper QR code library
 */
export function generateQRPattern(size: number = 21): boolean[][] {
  const pattern: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Add finder patterns (corners)
  const addFinderPattern = (x: number, y: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (x + i < size && y + j < size) {
          const isBorder = i === 0 || i === 6 || j === 0 || j === 6;
          const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
          pattern[x + i][y + j] = isBorder || isInner;
        }
      }
    }
  };

  // Add finder patterns
  addFinderPattern(0, 0);      // Top-left
  addFinderPattern(0, size - 7); // Top-right
  addFinderPattern(size - 7, 0); // Bottom-left

  // Add timing patterns
  for (let i = 8; i < size - 8; i++) {
    pattern[6][i] = i % 2 === 0;
    pattern[i][6] = i % 2 === 0;
  }

  // Add some data pattern (simplified)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (!pattern[i][j] && (i + j) % 3 === 0) {
        pattern[i][j] = Math.random() > 0.5;
      }
    }
  }

  return pattern;
}

/**
 * Render QR code pattern to canvas
 */
export function renderQRToCanvas(
  canvas: HTMLCanvasElement, 
  data: string, 
  options: {
    size?: number;
    backgroundColor?: string;
    foregroundColor?: string;
    margin?: number;
  } = {}
): void {
  const {
    size = 200,
    backgroundColor = '#ffffff',
    foregroundColor = '#000000',
    margin = 20
  } = options;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const pattern = generateQRPattern(21);
  const moduleSize = (size - margin * 2) / pattern.length;

  canvas.width = size;
  canvas.height = size;

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);

  // QR code modules
  ctx.fillStyle = foregroundColor;
  for (let i = 0; i < pattern.length; i++) {
    for (let j = 0; j < pattern[i].length; j++) {
      if (pattern[i][j]) {
        ctx.fillRect(
          margin + j * moduleSize,
          margin + i * moduleSize,
          moduleSize,
          moduleSize
        );
      }
    }
  }
}

/**
 * Create a profile URL for sharing
 */
export function createProfileUrl(profile: QRProfile): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const encodedProfile = btoa(JSON.stringify({
    name: profile.name,
    level: profile.level,
    credits: profile.totalCredits,
    trees: profile.treesSaved,
    entries: profile.totalEntries,
    co2: profile.co2Impact
  }));
  
  return `${baseUrl}/profile/${encodedProfile}`;
}

/**
 * Generate social sharing text for different platforms
 */
export function generateSharingText(profile: QRProfile, platform: 'line' | 'facebook' | 'whatsapp'): string {
  const baseStats = `🏆 Level: ${profile.level}
💚 ${profile.totalCredits} Carbon Credits
🌳 ${profile.treesSaved} Trees Saved
♻️ ${profile.totalEntries} Items Tracked
🌍 ${profile.co2Impact}kg CO₂ Saved`;

  const hashtags = '#ThailandWasteDiary #CarbonNeutral2050 #ZeroWaste #Sustainability';

  switch (platform) {
    case 'line':
      return `🌱 ผมได้ช่วยโลกแล้ว! Thailand Waste Diary

${baseStats}

มาร่วมกันช่วยโลกกับ Thailand Waste Diary! 
${hashtags}`;

    case 'facebook':
      return `🌱 I'm helping save the planet with Thailand Waste Diary!

${baseStats}

Join me in supporting Thailand's 2050 Carbon Neutral goal! 🇹🇭

${hashtags}`;

    case 'whatsapp':
      return `🌱 ผมได้ช่วยโลกแล้ว! Thailand Waste Diary

${baseStats}

มาร่วมกันช่วยโลก! ${profile.url}

${hashtags}`;

    default:
      return `🌱 Thailand Waste Diary Impact\n\n${baseStats}\n\n${hashtags}`;
  }
}

/**
 * Create a downloadable QR code image with profile info
 */
export function createProfileQRCard(
  profile: QRProfile,
  canvas: HTMLCanvasElement
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = 400;
  canvas.height = 600;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 600);
  gradient.addColorStop(0, '#f0fdf4');
  gradient.addColorStop(1, '#dcfce7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 600);

  // Header
  ctx.fillStyle = '#166534';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🌱 Thailand Waste Diary', 200, 50);

  // Profile info
  ctx.fillStyle = '#374151';
  ctx.font = '18px Arial';
  ctx.fillText(`Level: ${profile.level}`, 200, 85);
  ctx.fillText(`${profile.totalCredits} Carbon Credits`, 200, 110);
  ctx.fillText(`${profile.treesSaved} Trees Saved`, 200, 135);

  // QR Code area
  const qrCanvas = document.createElement('canvas');
  renderQRToCanvas(qrCanvas, JSON.stringify(profile), { size: 200 });
  
  ctx.drawImage(qrCanvas, 100, 160);

  // Stats
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Environmental Impact', 200, 400);
  
  ctx.fillStyle = '#374151';
  ctx.font = '14px Arial';
  ctx.fillText(`${profile.totalEntries} items tracked`, 200, 425);
  ctx.fillText(`${profile.co2Impact}kg CO₂ saved`, 200, 445);

  // Footer
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px Arial';
  ctx.fillText('Scan to view my environmental impact!', 200, 490);
  ctx.fillText('🇹🇭 Supporting Thailand 2050 Carbon Neutral', 200, 510);
  
  // Generated date
  const date = new Date().toLocaleDateString('th-TH');
  ctx.fillText(`Generated: ${date}`, 200, 550);
}