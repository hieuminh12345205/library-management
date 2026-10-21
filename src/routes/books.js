const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { toIsoVN } = require('../utils/dates');
const { ACTIVE_STATUSES } = require('../services/loans');
const v = require('../utils/validate');

const router = express.Router();

function serializeBook(b, full = true) {
  const book = {
    id: b.id,
    isbn: b.isbn,
    title: b.title,
    author: b.author,
    category: b.category,
    coverUrl: b.cover_url,
    availableCopies: b.available_copies,
    totalCopies: b.total_copies,
  };
  if (full) {
    Object.assign(book, {
      publisher: b.publisher,
      publishYear: b.publish_year,
      description: b.description,
      createdAt: toIsoVN(b.created_at),
      updatedAt: toIsoVN(b.updated_at),
    });
  }
  return book;
}

// Kiểm tra dữ liệu đầu sách (VR-10 → VR-14). partial = true khi sửa.
function validateBook(body, partial) {
  const b = body || {};
  const has = (k) => b[k] !== undefined;
  const need = (k) => !partial || has(k);
  const fields = {};
  const out = {};
  const currentYear = new Date().getFullYear();

  if (need('isbn')) {
    if (!v.isStr(b.isbn) || !v.ISBN_RE.test(b.isbn.trim())) fields.isbn = v.MSG.isbn;
    else out.isbn = b.isbn.trim();
  }
  if (need('title')) {
    const s = v.trimmed(b.title);
    if (!v.isStr(b.title) || s.length < 1 || s.length > 200) fields.title = v.MSG.title;
    else out.title = s;
  }
  if (need('author')) {
    const s = v.trimmed(b.author);
    if (!v.isStr(b.author) || s.length < 1 || s.length > 100) fields.author = v.MSG.author;
    else out.author = s;
  }
  if (need('category')) {
    if (!v.CATEGORIES.includes(b.category)) fields.category = v.MSG.category;
    else out.category = b.category;
  }
  if (need('totalCopies')) {
    if (!Number.isInteger(b.totalCopies) || b.totalCopies < 1 || b.totalCopies > 100) {
      fields.totalCopies = v.MSG.totalCopies;
    } else out.totalCopies = b.totalCopies;
  }
  if (has('publisher') && b.publisher !== null) {
    if (!v.isStr(b.publisher) || b.publisher.trim().length > 100) fields.publisher = v.MSG.publisher;
    else out.publisher = b.publisher.trim();
  }
  if (has('publishYear') && b.publishYear !== null) {
    if (!Number.isInteger(b.publishYear) || b.publishYear < 1900 || b.publishYear > currentYear) {
      fields.publishYear = v.MSG.publishYear;
    } else out.publishYear = b.publishYear;
  } else if (has('publishYear')) out.publishYear = null;
  if (has('description') && b.description !== null) {
    if (!v.isStr(b.description) || b.description.length > 2000) fields.description = v.MSG.description;
    else out.description = b.description;
  }
  if (has('coverUrl') && b.coverUrl !== null) {
    const s = v.trimmed(b.coverUrl);
    if (!v.isStr(b.coverUrl) || s.length > 500 || (s && !/^https?:\/\/\S+$/i.test(s))) {
      fields.coverUrl = v.MSG.coverUrl;
    } else out.coverUrl = s;
  }
  if (Object.keys(fields).length) throw badRequest(fields);
  return out;
}

// FR-03
router.get('/', async (req, res) => {
  const { q = '', category, available, sort = 'newest' } = req.query;
  const fields = {};
  if (!v.isStr(q) || q.length > 100) fields.q = v.MSG.q;
  if (category !== undefined && category !== '' && !v.CATEGORIES.includes(category)) fields.category = v.MSG.category;
  if (available !== undefined && !['true', 'false', ''].includes(available)) fields.available = 'Giá trị available là true hoặc false';
  if (!['title', 'newest'].includes(sort)) fields.sort = 'Giá trị sort là title hoặc newest';
  if (Object.keys(fields).length) throw badRequest(fields);
  const { page, size, offset } = v.parsePaging(req.query);

  const where = ['deleted_at IS NULL'];
  const params = [];
  const keyword = q.trim();
  if (keyword) {
    params.push(v.likePattern(keyword));
    where.push(`(title ILIKE $${params.length} OR author ILIKE $${params.length} OR isbn ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  const count = await db.query(`SELECT count(*)::int AS n FROM books WHERE ${where.join(' AND ')}`, params);
  if (available === 'true') where.push('available_copies > 0');
  const whereSql = where.join(' AND ');
  const orderSql = sort === 'title' ? 'title ASC, id ASC' : 'created_at DESC, id DESC';

  const { rows } = await db.query(
    `SELECT * FROM books WHERE ${whereSql} ORDER BY ${orderSql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, size, offset],
  );
  res.json({ data: rows.map((b) => serializeBook(b, false)), pagination: v.pagination(page, size, count.rows[0].n) });
});

// FR-04
router.get('/:id', async (req, res) => {
  const id = v.parseId(req.params.id);
  const { rows } = await db.query('SELECT * FROM books WHERE id = $1 AND deleted_at IS NULL', [id]);
  if (!rows[0]) throw notFound('Không tìm thấy sách.');
  res.json({ data: serializeBook(rows[0]) });
});

// FR-10 – thêm
router.post('/', requireAuth('LIBRARIAN'), async (req, res) => {
  const d = validateBook(req.body, false);
  try {
    const { rows } = await db.query(
      `INSERT INTO books (isbn, title, author, category, publisher, publish_year, total_copies, available_copies, description, cover_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9) RETURNING *`,
      [d.isbn, d.title, d.author, d.category, d.publisher ?? '', d.publishYear ?? null, d.totalCopies, d.description ?? '', d.coverUrl ?? ''],
    );
    res.status(201).json({ data: serializeBook(rows[0]) });
  } catch (err) {
    if (err.code === '23505') throw conflict('ISBN_EXISTS', 'ISBN đã tồn tại.');
    throw err;
  }
});

// FR-10 – sửa
router.put('/:id', requireAuth('LIBRARIAN'), async (req, res) => {
  const id = v.parseId(req.params.id);
  const d = validateBook(req.body, true);

  const book = await db.transaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM books WHERE id = $1 AND deleted_at IS NULL FOR UPDATE', [id]);
    const cur = rows[0];
    if (!cur) throw notFound('Không tìm thấy sách.');

    let available = cur.available_copies;
    if (d.totalCopies !== undefined) {
      const inUse = cur.total_copies - cur.available_copies;
      if (d.totalCopies < inUse) {
        throw conflict('COPIES_IN_USE', `Số bản không được nhỏ hơn số bản đang cho mượn (${inUse}).`);
      }
      available = d.totalCopies - inUse;
    }
    try {
      const upd = await client.query(
        `UPDATE books SET isbn = $2, title = $3, author = $4, category = $5, publisher = $6, publish_year = $7,
                total_copies = $8, available_copies = $9, description = $10, cover_url = $11, updated_at = now()
         WHERE id = $1 RETURNING *`,
        [
          id,
          d.isbn ?? cur.isbn,
          d.title ?? cur.title,
          d.author ?? cur.author,
          d.category ?? cur.category,
          d.publisher ?? cur.publisher,
          d.publishYear !== undefined ? d.publishYear : cur.publish_year,
          d.totalCopies ?? cur.total_copies,
          available,
          d.description ?? cur.description,
          d.coverUrl ?? cur.cover_url,
        ],
      );
      return upd.rows[0];
    } catch (err) {
      if (err.code === '23505') throw conflict('ISBN_EXISTS', 'ISBN đã tồn tại.');
      throw err;
    }
  });
  res.json({ data: serializeBook(book) });
});

// FR-10 – xoá (BR-11)
router.delete('/:id', requireAuth('LIBRARIAN'), async (req, res) => {
  const id = v.parseId(req.params.id);
  await db.transaction(async (client) => {
    const { rows } = await client.query('SELECT id FROM books WHERE id = $1 AND deleted_at IS NULL FOR UPDATE', [id]);
    if (!rows[0]) throw notFound('Không tìm thấy sách.');
    const active = await client.query('SELECT 1 FROM loans WHERE book_id = $1 AND status = ANY($2) LIMIT 1', [
      id,
      ACTIVE_STATUSES,
    ]);
    if (active.rowCount) throw conflict('BOOK_IN_USE', 'Không thể xoá sách đang được mượn hoặc chờ duyệt.');
    await client.query('UPDATE books SET deleted_at = now() WHERE id = $1', [id]);
  });
  res.json({ data: { id, deleted: true } });
});

module.exports = { router };
