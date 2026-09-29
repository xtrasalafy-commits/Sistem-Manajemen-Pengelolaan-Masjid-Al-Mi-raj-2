const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { buildSearchFilter, buildSortClause, paginateQuery } = require('../utils/dbHelpers');

const ALLOWED_SORT = ['created_at', 'modul', 'aksi', 'user_id'];

/**
 * GET /api/audit  (admin only) - audit trail seluruh aksi
 * Query: modul, aksi, userId, search, tanggalMulai, tanggalSelesai, page, limit
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { modul, aksi, userId, tanggalMulai, tanggalSelesai, search, sortBy, sortOrder } = req.query;
  const { limit, offset } = req.pagination;

  const { where: searchWhere, params } = buildSearchFilter(search, ['modul', 'aksi'], 1);

  const extra = [];
  let idx = 1 + params.length;
  if (modul) {
    extra.push(`modul = $${idx++}`);
    params.push(modul);
  }
  if (aksi) {
    extra.push(`aksi = $${idx++}`);
    params.push(aksi);
  }
  if (userId) {
    extra.push(`user_id = $${idx++}`);
    params.push(userId);
  }
  if (tanggalMulai) {
    extra.push(`created_at >= $${idx++}`);
    params.push(tanggalMulai);
  }
  if (tanggalSelesai) {
    extra.push(`created_at <= ($${idx++}::date + interval '1 day')`);
    params.push(tanggalSelesai);
  }
  const where = [searchWhere, extra.length ? `WHERE ${extra.join(' AND ')}` : ''].filter(Boolean).join(' AND ');

  const sort = buildSortClause(sortBy, ALLOWED_SORT, sortOrder, 'created_at', 'desc');

  const { rows, total } = await paginateQuery({
    dataQuery: `SELECT a.id, a.aksi, a.modul, a.record_id, a.detail, a.ip_address, a.created_at, u.nama as user_nama, u.email as user_email
                FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id
                ${where} ${sort}`,
    countQuery: `SELECT COUNT(*) FROM audit_logs a ${where}`,
    params,
    limit,
    offset,
    startParamIndex: idx,
  });

  res.status(200).json({
    status: 'success',
    data: {
      audit: rows,
      pagination: { page: req.pagination.page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

/**
 * GET /api/audit/modul  -> daftar modul yang tercatat (untuk filter frontend)
 */
const getAuditModulList = asyncHandler(async (_req, res) => {
  const { rows } = await query('SELECT DISTINCT modul FROM audit_logs ORDER BY modul ASC');
  res.status(200).json({ status: 'success', data: { modul: rows.map((r) => r.modul) } });
});

module.exports = { getAuditLogs, getAuditModulList };
