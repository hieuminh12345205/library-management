const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const config = require('../src/config');

async function initializeSchema() {
  // Tạo bảng qua kết nối trực tiếp (không qua pooler) nếu có DATABASE_URL_UNPOOLED
  const client = new Client({
    connectionString: config.databaseUrlUnpooled || config.databaseUrl,
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();
    await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  } finally {
    await client.end();
  }
}

module.exports = { initializeSchema };
