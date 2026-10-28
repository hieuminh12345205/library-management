const { Pool, types } = require('pg');
const config = require('./config');

// Trả kiểu DATE dưới dạng chuỗi 'YYYY-MM-DD', tránh lệch múi giờ
types.setTypeParser(1082, (v) => v);

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  keepAlive: true,
});

// DB từ xa (Neon tạm ngủ, khởi động lại) có thể đóng kết nối rảnh – chỉ ghi log, không làm sập server
pool.on('error', (err) => {
  console.error('Idle PostgreSQL connection error:', err.code || err.message);
});

function query(text, params) {
  return pool.query(text, params);
}

// Chạy fn(client) trong một transaction
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, transaction };
