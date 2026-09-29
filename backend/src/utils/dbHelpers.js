const { query } = require('../config/db');

/**
 * Bangun clause WHERE untuk pencarian (ILIKE) pada beberapa kolom.
 * @param {string|null} search - kata kunci
 * @param {string[]} columns - kolom yang dicari (harus whitelist!)
 * @param {number} startParamIndex - index awal parameter ($n)
 * @returns {{ where: string, params: any[] }}
 */
const buildSearchFilter = (search, columns, startParamIndex = 1) => {
  if (!search || columns.length === 0) {
    return { where: '', params: [] };
  }
  const conditions = columns.map((col, i) => `${col} ILIKE $${startParamIndex + i}`);
  const params = columns.map(() => `%${search}%`);
  return { where: `WHERE (${conditions.join(' OR ')})`, params };
};

/**
 * Bangun ORDER BY aman (sortBy divalidasi terhadap whitelist).
 * @param {string} sortBy - nama kolom dari query
 * @param {string[]} allowed - whitelist kolom yang diizinkan
 * @param {string} sortOrder - 'asc' | 'desc'
 * @param {string} defaultSort
 */
const buildSortClause = (sortBy, allowed, sortOrder = 'asc', defaultSort) => {
  const column = allowed.includes(sortBy) ? sortBy : defaultSort;
  const direction = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return `ORDER BY ${column} ${direction}`;
};

/**
 * Helper paginasi: jalankan query data + query total count.
 * @param {object} opts
 * @param {string} opts.dataQuery - SQL data (tanpa LIMIT/OFFSET), boleh berisi WHERE + ORDER BY
 * @param {string} opts.countQuery - SQL count, mis. "SELECT COUNT(*) FROM ..."
 * @param {any[]} opts.params - parameter (harus sama urutannya untuk data & count)
 * @param {number} opts.limit
 * @param {number} opts.offset
 * @param {number} opts.startParamIndex - index parameter setelah clause WHERE (untuk LIMIT/OFFSET)
 */
const paginateQuery = async ({ dataQuery, countQuery, params, limit, offset, startParamIndex }) => {
  const limitIdx = startParamIndex;
  const offsetIdx = startParamIndex + 1;

  const dataSql = `${dataQuery} LIMIT $${limitIdx} OFFSET $${offsetIdx}`;

  const [dataResult, countResult] = await Promise.all([
    query(dataSql, [...params, limit, offset]),
    query(countQuery, params),
  ]);

  const total = parseInt(countResult.rows[0]?.count ?? 0, 10);
  return { rows: dataResult.rows, total };
};

module.exports = { buildSearchFilter, buildSortClause, paginateQuery };
