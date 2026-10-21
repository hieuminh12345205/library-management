const fs = require('fs');
const path = require('path');
const config = require('./config');
const db = require('./db');
const app = require('./app');

async function main() {
  // Tạo bảng nếu chưa có
  await db.query(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
  // Dọn token đã hết hạn
  await db.query('DELETE FROM revoked_tokens WHERE expires_at < now()');

  app.listen(config.port, () => {
    console.log(`LibraryHub đang chạy tại http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Không khởi động được máy chủ:', err);
  process.exit(1);
});
