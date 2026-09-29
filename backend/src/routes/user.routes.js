const express = require('express');
const router = express.Router();

const { authenticate, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { parsePagination, paginationRules } = require('../middlewares/pagination');
const { createUserRules, updateUserRules } = require('../validators/user.validator');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');

/**
 * @route  GET /api/users
 * @desc   Daftar user (search, filter role/status, pagination)
 * @access Admin
 */
router.get('/', authenticate, adminOnly, paginationRules, validate, parsePagination, getAllUsers);

/**
 * @route  GET /api/users/:id
 * @access Admin
 */
router.get('/:id', authenticate, adminOnly, getUserById);

/**
 * @route  POST /api/users
 * @desc   Admin membuatkan akun untuk orang lain
 * @access Admin
 */
router.post('/', authenticate, adminOnly, createUserRules, validate, createUser);

/**
 * @route  PUT /api/users/:id
 * @access Admin
 */
router.put('/:id', authenticate, adminOnly, updateUserRules, validate, updateUser);

/**
 * @route  DELETE /api/users/:id
 * @access Admin
 */
router.delete('/:id', authenticate, adminOnly, deleteUser);

module.exports = router;
