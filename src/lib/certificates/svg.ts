// src/lib/certificates/svg.ts
import QRCode from 'qrcode';

/**
 * Escape user strings for XML/SVG safety
 */
function esc(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export type BuildCertParams = {
  student: string;
  course: string;
  issuedOn: string; // human-readable date
  certificateId?: string; // e.g. C-2025-000123
  platformName?: string; // e.g. "LambAcademy"
  scorePercent?: number; // optional: 0..100
  signatureName?: string; // optional
  signatureTitle?: string; // optional (e.g. "Program Director")
  signatureImageUrl?: string; // optional PNG/SVG
  sealImageUrl?: string; // optional PNG/SVG
  logoImageUrl?: string; // optional PNG/SVG
  verificationUrl?: string; // if provided, a QR will be drawn that points here
  theme?: 'blue' | 'emerald' | 'rose' | 'slate';
};

/**
 * Create a crisp, printable 1600x1131 SVG certificate.
 * If verificationUrl is provided, a QR code is embedded (as data URL).
 */
export async function buildCertificateSVG({
  student,
  course,
  issuedOn,
  certificateId,
  platformName = 'LambAcademy',
  scorePercent,
  signatureName,
  signatureTitle,
  signatureImageUrl,
  sealImageUrl,
  logoImageUrl,
  verificationUrl,
  theme = 'blue',
}: BuildCertParams): Promise<string> {
  // Generate QR (optional)
  const qrDataUrl = verificationUrl
    ? await QRCode.toDataURL(verificationUrl, { margin: 0, width: 260 })
    : null;

  // theme colors
  const palettes = {
    blue: { a: '#0ea5e9', b: '#6366f1', text: '#0f172a', sub: '#334155' },
    emerald: { a: '#10b981', b: '#22c55e', text: '#052e16', sub: '#134e4a' },
    rose: { a: '#fb7185', b: '#f43f5e', text: '#3b0d0c', sub: '#7f1d1d' },
    slate: { a: '#64748b', b: '#0ea5e9', text: '#0f172a', sub: '#334155' },
  } as const;
  const { a, b, text, sub } = palettes[theme];

  const scoreText =
    typeof scorePercent === 'number'
      ? `Final Score: ${Math.round(scorePercent)}%`
      : '';

  // Use <image href="..."> for optional brand assets. They can be PNG/SVG from your CDN.
  // Use system fonts to keep file lightweight.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1131" viewBox="0 0 1600 1131">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/>
      <stop offset="1" stop-color="${b}"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.12"/>
    </filter>
    <style>
      .heading { font-family: Inter, Arial, Helvetica, sans-serif; font-weight: 800; fill: ${text}; }
      .label   { font-family: Inter, Arial, Helvetica, sans-serif; font-weight: 600; fill: ${sub}; }
      .body    { font-family: Inter, Arial, Helvetica, sans-serif; fill: ${sub}; }
    </style>
  </defs>

  <!-- outer background -->
  <rect width="100%" height="100%" fill="#ffffff"/>
  <!-- gradient frame -->
  <rect x="28" y="28" width="1544" height="1075" rx="28" fill="url(#grad)" opacity="0.10"/>

  <!-- inner card -->
  <g filter="url(#softShadow)">
    <rect x="72" y="80" width="1456" height="971" rx="24" fill="#ffffff"/>
  </g>

  <!-- top brand row -->
  <g transform="translate(120, 120)">
    ${
      logoImageUrl
        ? `<image href="${esc(
            logoImageUrl
          )}" x="0" y="0" height="80" width="80" />`
        : ''
    }
    <text x="${
      logoImageUrl ? 100 : 0
    }" y="56" class="heading" font-size="36">${esc(platformName)}</text>
  </g>

  <!-- title -->
  <text x="800" y="260" text-anchor="middle" class="heading" font-size="56">Certificate of Completion</text>

  <!-- certificate id (optional) -->
  ${
    certificateId
      ? `<text x="800" y="305" text-anchor="middle" class="body" font-size="16" opacity="0.7">Certificate ID: ${esc(
          certificateId
        )}</text>`
      : ''
  }

  <!-- statement -->
  <text x="800" y="380" text-anchor="middle" class="body" font-size="28">This certifies that</text>
  <text x="800" y="460" text-anchor="middle" class="heading" font-size="72">${esc(
    student
  )}</text>
  <text x="800" y="520" text-anchor="middle" class="body" font-size="24">has successfully completed the course</text>
  <text x="800" y="580" text-anchor="middle" class="heading" font-size="44" fill="${a}">${esc(
    course
  )}</text>
  ${
    scoreText
      ? `<text x="800" y="630" text-anchor="middle" class="body" font-size="22">${esc(
          scoreText
        )}</text>`
      : ''
  }

  <!-- footer row -->
  <g transform="translate(180, 720)">
    <!-- signature block -->
    <g>
      <rect x="0" y="0" width="520" height="220" rx="16" fill="#f8fafc" stroke="#e2e8f0"/>
      ${
        signatureImageUrl
          ? `<image href="${esc(
              signatureImageUrl
            )}" x="24" y="20" width="180" height="60" preserveAspectRatio="xMidYMid meet" />`
          : ''
      }
      <line x1="24" y1="130" x2="496" y2="130" stroke="#cbd5e1" stroke-width="2"/>
      ${
        signatureName
          ? `<text x="24" y="165" class="label" font-size="20">${esc(
              signatureName
            )}</text>`
          : ''
      }
      ${
        signatureTitle
          ? `<text x="24" y="195" class="body" font-size="16" opacity="0.8">${esc(
              signatureTitle
            )}</text>`
          : ''
      }
    </g>

    <!-- spacer -->
    <g transform="translate(560, 0)">
      <rect x="0" y="0" width="520" height="220" rx="16" fill="#f8fafc" stroke="#e2e8f0"/>
      ${
        sealImageUrl
          ? `<image href="${esc(
              sealImageUrl
            )}" x="24" y="24" width="96" height="96" />`
          : ''
      }
      <text x="140" y="64" class="label" font-size="20">Issued on</text>
      <text x="140" y="100" class="body" font-size="20">${esc(issuedOn)}</text>
      ${
        qrDataUrl
          ? `
            <g transform="translate(360,24)">
              <rect x="0" y="0" width="136" height="136" rx="12" fill="#fff" stroke="#e2e8f0"/>
              <image href="${qrDataUrl}" x="8" y="8" width="120" height="120" />
              <text x="68" y="170" text-anchor="middle" class="body" font-size="12" opacity="0.8">Verify</text>
            </g>
          `
          : ''
      }
    </g>
  </g>

  <!-- bottom watermark -->
  <text x="800" y="1060" text-anchor="middle" class="body" font-size="14" opacity="0.6">
    ${esc(platformName)} • ${esc(issuedOn)}
  </text>
</svg>`;
}
