// Re-export agar middleware pagination bisa dipanggil dari routes secara konsisten
const {
  paginationRules,
  parsePagination,
} = require('../validators/common.validator');

module.exports = { paginationRules, parsePagination };
