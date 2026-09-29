const { query } = require('express-validator');

/** Validator parameter query pagination & sorting (dipakai semua modul). */
const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page harus bilangan bulat >= 1').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit harus bilangan bulat 1-100')
    .toInt(),
  query('search').optional().trim().escape(),
  query('sortBy').optional().trim().escape(),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder harus asc/desc'),
];

/** Parser pagination -> req.pagination = { page, limit, offset } */
const parsePagination = (req, _res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  req.pagination = { page, limit, offset: (page - 1) * limit };
  next();
};

module.exports = { paginationRules, parsePagination };
