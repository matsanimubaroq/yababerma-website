// Client-side "Kartu Ucapan Kebaikan" generator (no external deps, pure Canvas API)
import { formatRupiah } from '@/lib/site-data';

const ORG_NAME = 'YAYASAN BANUA BERKAH MANDIRI';
const WEBSITE = 'yababerma.org';

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawHeart(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = size;
  ctx.moveTo(cx, cy + s * 0.35);
  ctx.bezierCurveTo(cx, cy + s * 0.1, cx - s * 0.5, cy - s * 0.25, cx - s * 0.5, cy - s * 0.55);
  ctx.bezierCurveTo(cx - s * 0.5, cy - s * 0.9, cx - s * 0.1, cy - s * 0.9, cx, cy - s * 0.6);
  ctx.bezierCurveTo(cx + s * 0.1, cy - s * 0.9, cx + s * 0.5, cy - s * 0.9, cx + s * 0.5, cy - s * 0.55);
  ctx.bezierCurveTo(cx + s * 0.5, cy - s * 0.25, cx, cy + s * 0.1, cx, cy + s * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = String(text || '').split(' ');
  let line = '';
  let curY = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, curY);
      line = words[i];
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) { ctx.fillText(line, cx, curY); curY += lineHeight; }
  return curY;
}

export function generateGreetingCanvas(donation) {
  const W = 1080, H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const cx = W / 2;

  // Background gradient (emerald -> azure, diagonal)
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#00A651');
  grad.addColorStop(1, '#0082C8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative translucent circles
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(W - 60, 90, 190, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(70, H - 70, 150, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // White panel
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 70, 70, W - 140, H - 140, 44);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Heart badge
  ctx.save();
  ctx.fillStyle = '#E6F6EE';
  ctx.beginPath(); ctx.arc(cx, 210, 62, 0, Math.PI * 2); ctx.fill();
  drawHeart(ctx, cx, 214, 78, '#00A651');
  ctx.restore();

  // Foundation name (letter spaced)
  ctx.fillStyle = '#00A651';
  ctx.font = '700 26px Arial, sans-serif';
  ctx.save();
  const spaced = ORG_NAME.split('').join('\u200a');
  ctx.fillText(spaced, cx, 318);
  ctx.restore();

  // "TERIMA KASIH"
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 30px Arial, sans-serif';
  ctx.fillText('T E R I M A   K A S I H', cx, 400);

  // Donor name
  const name = donation.is_anonymous ? 'Sahabat Donatur' : (donation.donor_name || 'Sahabat Donatur');
  ctx.fillStyle = '#0F172A';
  ctx.font = '800 68px Arial, sans-serif';
  let y = wrapText(ctx, name, cx, 480, 820, 74);

  // subtitle
  ctx.fillStyle = '#64748b';
  ctx.font = '400 30px Arial, sans-serif';
  y += 6;
  ctx.fillText('atas kebaikan Anda untuk program', cx, y);
  y += 46;

  // program title
  ctx.fillStyle = '#0082C8';
  ctx.font = '700 40px Arial, sans-serif';
  y = wrapText(ctx, donation.campaign_title || 'Donasi Kebaikan', cx, y, 820, 50);

  // amount pill
  y += 24;
  const amount = formatRupiah(donation.amount || donation.total_amount || 0);
  ctx.font = '800 60px Arial, sans-serif';
  const aw = ctx.measureText(amount).width;
  const pillW = Math.min(Math.max(aw + 120, 360), 820);
  const pillH = 116;
  ctx.fillStyle = '#E6F6EE';
  roundRect(ctx, cx - pillW / 2, y, pillW, pillH, 30);
  ctx.fill();
  ctx.fillStyle = '#00A651';
  ctx.fillText(amount, cx, y + 78);
  y += pillH + 60;

  // Dua / quote
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 400 32px Georgia, serif';
  y = wrapText(ctx, '"Semoga menjadi amal jariyah yang berkah dan berlipat ganda. Aamiin."', cx, y, 780, 44);

  // Divider
  y += 20;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 300, y); ctx.lineTo(cx + 300, y); ctx.stroke();
  y += 44;

  // Footer info
  const date = new Date(donation.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 26px Arial, sans-serif';
  ctx.fillText(date, cx, y);
  y += 40;
  if (donation.id) {
    ctx.fillText('No. Ref: ' + String(donation.id).slice(0, 8).toUpperCase(), cx, y);
    y += 40;
  }
  ctx.fillStyle = '#0082C8';
  ctx.font = '700 28px Arial, sans-serif';
  ctx.fillText(WEBSITE, cx, y);

  return canvas;
}

export function downloadGreetingCard(donation) {
  try {
    const canvas = generateGreetingCanvas(donation);
    const safeName = (donation.donor_name || 'donatur').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const finish = (url, revoke) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `kartu-kebaikan-${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (revoke) setTimeout(() => URL.revokeObjectURL(url), 1500);
    };
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (!blob) { finish(canvas.toDataURL('image/png'), false); return; }
        finish(URL.createObjectURL(blob), true);
      }, 'image/png');
    } else {
      finish(canvas.toDataURL('image/png'), false);
    }
  } catch (e) {
    console.error('Greeting card error', e);
  }
}

export function getGreetingDataUrl(donation) {
  try {
    return generateGreetingCanvas(donation).toDataURL('image/png');
  } catch (e) {
    console.error('Greeting preview error', e);
    return null;
  }
}

export function greetingWaText(donation, siteUrl) {
  const program = donation.campaign_title || 'program kebaikan';
  const base = siteUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://yababerma.org');
  return `Alhamdulillah, saya baru saja menyalurkan donasi untuk "${program}" melalui Yayasan Banua Berkah Mandiri.\n\nYuk, ikut berbagi kebaikan bersama:\n${base}/donasi`;
}

export function shareGreetingWhatsApp(donation, siteUrl) {
  const text = greetingWaText(donation, siteUrl);
  const url = 'https://wa.me/?text=' + encodeURIComponent(text);
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
}
