const express = require('express');
const router = express.Router();

const { authenticate, adminOnly } = require('../middlewares/auth');
const { parsePagination, paginationRules } = require('../middlewares/pagination');
const validate = require('../middlewares/validate');
const { getAuditLogs, getAuditModulList } = require('../controllers/audit.controller');

/**
 * @route  GET /api/audit
 * @desc   Audit trail seluruh aksi (filter modul/aksi/user/periode)
 * @access Admin
 */
router.get('/', authenticate, adminOnly, paginationRules, validate, parsePagination, getAuditLogs);

/**
 * @route  GET /api/audit/modul
 * @desc   Daftar modul untuk filter
 * @access Admin
 */
router.get('/modul', authenticate, adminOnly, getAuditModulList);

module.exports = router;
