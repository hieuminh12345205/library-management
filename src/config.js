// Biến môi trường của nền tảng (Render, VPS) được ưu tiên; trên máy đọc .env.local rồi .env
require('dotenv').config({ path: ['.env.local', '.env'], quiet: true });

function databaseUrl(value) {
  if (!value) return value;
  const url = new URL(value);
  // Neon: luôn kiểm tra đầy đủ chứng chỉ SSL (verify-full)
  if (url.hostname.endsWith('.neon.tech') && ['prefer', 'require', 'verify-ca'].includes(url.searchParams.get('sslmode'))) {
    url.searchParams.set('sslmode', 'verify-full');
    return url.toString();
  }
  return value;
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: databaseUrl(process.env.DATABASE_URL || 'postgres://library:library@localhost:5432/library'),
  databaseUrlUnpooled: databaseUrl(process.env.DATABASE_URL_UNPOOLED),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: 3600, // giây – NFR-07
  bcryptCost: 12, // NFR-06
};
