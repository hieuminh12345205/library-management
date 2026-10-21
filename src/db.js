const { Pool, types } = require('pg');
const config = require('./config');

// Trả kiểu DATE dưới dạng chuỗi 'YYYY-MM-DD', tránh lệch múi giờ
types.setTypeParser(1082, (v) => v);

const pool = new Pool({ connectionString: config.databaseUrl, max: 20 });

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
