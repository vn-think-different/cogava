/**
 * Tiện ích hỗ trợ Căn cước công dân (CCCD) và xử lý ảnh thẻ
 */

/**
 * Format số CCCD cho dễ đọc: 079095012345 -> 079 095 012 345
 */
export function formatCccdNumber(soCccd?: string): string {
  if (!soCccd) return '';
  const clean = soCccd.replace(/\D/g, '');
  if (clean.length === 12) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9, 12)}`;
  }
  return clean;
}

/**
 * Nén và chuyển đổi file ảnh từ thiết bị thành Data URL nhẹ (~40KB - 90KB)
 * Đảm bảo lưu trữ trong LocalStorage không bị tràn bộ nhớ (QuotaExceededError)
 */
export function compressImageFileToDataUrl(
  file: File,
  maxWidth = 900,
  maxHeight = 600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Không thể giải mã file ảnh'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Tạo hình ảnh mẫu CCCD Mặt trước định dạng SVG Data URL
 */
export function createSampleCccdFront(hoTen: string, soCccd: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 340" width="540" height="340">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E8F4F8"/>
        <stop offset="50%" stop-color="#F5FAF0"/>
        <stop offset="100%" stop-color="#E6F2F0"/>
      </linearGradient>
      <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#FFA500"/>
      </linearGradient>
    </defs>
    <!-- Background Card -->
    <rect width="540" height="340" rx="18" fill="url(#bgGrad)" stroke="#B3D7E5" stroke-width="2.5"/>
    <rect x="6" y="6" width="528" height="328" rx="14" fill="none" stroke="#2B6B88" stroke-width="0.75" stroke-opacity="0.3"/>
    
    <!-- Header Flag Emblem & Text -->
    <circle cx="56" cy="46" r="22" fill="#DA251D"/>
    <polygon points="56,31 59.5,41 70,41 61.5,47.5 64.5,58 56,52 47.5,58 50.5,47.5 42,41 52.5,41" fill="#FF0"/>
    
    <text x="280" y="32" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#B3241C" text-anchor="middle" letter-spacing="1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</text>
    <text x="280" y="47" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" fill="#1C3852" text-anchor="middle">Độc lập - Tự do - Hạnh phúc</text>
    <line x1="220" y1="52" x2="340" y2="52" stroke="#B3241C" stroke-width="1.2"/>
    
    <text x="280" y="74" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="#B3241C" text-anchor="middle">CĂN CƯỚC CÔNG DÂN</text>
    <text x="280" y="87" font-family="Arial, sans-serif" font-size="9" font-style="italic" fill="#526E7E" text-anchor="middle">Citizen Identity Card</text>
    
    <!-- Photo Frame & Avatar Silhouette -->
    <rect x="36" y="96" width="112" height="148" rx="6" fill="#D3E4EA" stroke="#6891A4" stroke-width="1.5"/>
    <circle cx="92" cy="148" r="30" fill="#7C9BAA"/>
    <path d="M56 226 C 56 194, 128 194, 128 226 Z" fill="#7C9BAA"/>
    
    <!-- Chip Icon -->
    <rect x="168" y="104" width="46" height="36" rx="4" fill="url(#chipGrad)" stroke="#B8860B" stroke-width="1"/>
    <line x1="168" y1="122" x2="214" y2="122" stroke="#B8860B" stroke-width="0.8"/>
    <line x1="191" y1="104" x2="191" y2="140" stroke="#B8860B" stroke-width="0.8"/>
    <rect x="180" y="112" width="22" height="20" rx="2" fill="none" stroke="#B8860B" stroke-width="0.8"/>

    <!-- ID Number -->
    <text x="235" y="118" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#3D566E">Số / No.:</text>
    <text x="235" y="140" font-family="'Courier New', Courier, monospace" font-size="20" font-weight="bold" fill="#C0261C" letter-spacing="1.5">${soCccd}</text>

    <!-- Details -->
    <text x="168" y="168" font-family="Arial, sans-serif" font-size="10" fill="#526E7E">Họ và tên / Full name:</text>
    <text x="168" y="188" font-family="Arial, sans-serif" font-size="15" font-weight="900" fill="#1C3852">${hoTen.toUpperCase()}</text>

    <text x="168" y="210" font-family="Arial, sans-serif" font-size="10" fill="#526E7E">Ngày sinh / Date of birth:</text>
    <text x="310" y="210" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" fill="#1C3852">15/08/1996</text>

    <text x="168" y="230" font-family="Arial, sans-serif" font-size="10" fill="#526E7E">Giới tính / Sex:</text>
    <text x="245" y="230" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" fill="#1C3852">Nam</text>
    <text x="310" y="230" font-family="Arial, sans-serif" font-size="10" fill="#526E7E">Quốc tịch / Nat.:</text>
    <text x="400" y="230" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" fill="#1C3852">Việt Nam</text>

    <text x="168" y="250" font-family="Arial, sans-serif" font-size="10" fill="#526E7E">Nơi thường trú / Place of residence:</text>
    <text x="168" y="267" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" fill="#1C3852">Dĩ An, Tỉnh Bình Dương</text>

    <!-- Validity -->
    <text x="36" y="278" font-family="Arial, sans-serif" font-size="8.5" fill="#526E7E">Có giá trị đến / Date of expiry:</text>
    <text x="36" y="293" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#C0261C">15/08/2036</text>
    
    <!-- Watermark text -->
    <text x="470" y="322" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#88A0B0" text-anchor="end">MẶT TRƯỚC</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Tạo hình ảnh mẫu CCCD Mặt sau định dạng SVG Data URL
 */
export function createSampleCccdBack(hoTen: string, soCccd: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 340" width="540" height="340">
    <defs>
      <linearGradient id="bgGradBack" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F2F8F5"/>
        <stop offset="50%" stop-color="#EAF3EE"/>
        <stop offset="100%" stop-color="#DDECE5"/>
      </linearGradient>
    </defs>
    <!-- Background Card -->
    <rect width="540" height="340" rx="18" fill="url(#bgGradBack)" stroke="#A9CEC0" stroke-width="2.5"/>
    <rect x="6" y="6" width="528" height="328" rx="14" fill="none" stroke="#2B6B88" stroke-width="0.75" stroke-opacity="0.3"/>

    <!-- Left: Identification Marks -->
    <text x="32" y="36" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" fill="#1C3852">Đặc điểm nhân dạng / Personal identification:</text>
    <text x="32" y="54" font-family="Arial, sans-serif" font-size="10" fill="#2C485A">Nốt ruồi cách 1cm dưới sau đuôi lông mày trái</text>

    <!-- Fingerprints Mockup -->
    <text x="32" y="80" font-family="Arial, sans-serif" font-size="9.5" fill="#526E7E">Ngón trỏ trái / Left index</text>
    <rect x="32" y="88" width="80" height="92" rx="6" fill="#FFF" stroke="#A0BCB0" stroke-width="1"/>
    <path d="M52 134 Q 72 100 92 134 Q 72 168 52 134 M60 134 Q 72 115 84 134" fill="none" stroke="#375548" stroke-width="1.8" stroke-linecap="round"/>

    <text x="135" y="80" font-family="Arial, sans-serif" font-size="9.5" fill="#526E7E">Ngón trỏ phải / Right index</text>
    <rect x="135" y="88" width="80" height="92" rx="6" fill="#FFF" stroke="#A0BCB0" stroke-width="1"/>
    <path d="M155 134 Q 175 100 195 134 Q 175 168 155 134 M163 134 Q 175 115 187 134" fill="none" stroke="#375548" stroke-width="1.8" stroke-linecap="round"/>

    <!-- QR Code / Chip & Date of Issue -->
    <rect x="390" y="30" width="115" height="115" rx="8" fill="#FFF" stroke="#688E7E" stroke-width="1.5"/>
    <rect x="402" y="42" width="91" height="91" fill="#1E382E"/>
    <rect x="414" y="54" width="22" height="22" fill="#FFF"/>
    <rect x="459" y="54" width="22" height="22" fill="#FFF"/>
    <rect x="414" y="99" width="22" height="22" fill="#FFF"/>
    <rect x="445" y="86" width="15" height="15" fill="#FFF"/>

    <!-- Issue Authority -->
    <text x="240" y="152" font-family="Arial, sans-serif" font-size="10.5" fill="#1C3852">Ngày cấp / Date: <tspan font-weight="bold">10/01/2022</tspan></text>
    <text x="240" y="170" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#B3241C">CỤC TRƯỞNG CỤC CẢNH SÁT QUẢN LÝ HÀNH CHÍNH</text>
    <text x="240" y="184" font-family="Arial, sans-serif" font-size="9.5" font-weight="bold" fill="#B3241C">VỀ TRẬT TỰ XÃ HỘI</text>

    <!-- MRZ (Machine Readable Zone) -->
    <rect x="24" y="218" width="492" height="96" rx="8" fill="#F4F8F6" stroke="#9BB8AA" stroke-width="1"/>
    <text x="36" y="248" font-family="'Courier New', Courier, monospace" font-size="14.5" font-weight="bold" fill="#1C3852" letter-spacing="3.5">IDVNM${soCccd}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
    <text x="36" y="274" font-family="'Courier New', Courier, monospace" font-size="14.5" font-weight="bold" fill="#1C3852" letter-spacing="3.5">9608154M3608152VNM&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;8</text>
    <text x="36" y="300" font-family="'Courier New', Courier, monospace" font-size="14.5" font-weight="bold" fill="#1C3852" letter-spacing="3.5">${hoTen.toUpperCase().replace(/\s+/g, '&lt;')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>

    <!-- Watermark text -->
    <text x="470" y="322" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#88A0B0" text-anchor="end">MẶT SAU</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
