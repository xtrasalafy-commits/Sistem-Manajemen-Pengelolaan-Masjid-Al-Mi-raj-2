const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const config = require('../config/env');

const BRAND = 'Masjid Al-Mi\'raj';
const GREEN = '#0B6E4F';
const DARK = '#1f2937';

/**
 * Generate file Excel (.xlsx) dari array of object.
 * @param {object} opts
 * @param {string} opts.title - Judul sheet
 * @param {string} [opts.subtitle]
 * @param {string[]} opts.columns - header
 * @param {Array<Array>} opts.rows - data (urutan mengikuti columns)
 * @param {string} [opts.sheetName]
 * @returns {Promise<Buffer>}
 */
const generateExcel = async ({ title, subtitle, columns, rows, sheetName = 'Laporan' }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName, {
    properties: { defaultColWidth: 18 },
  });

  // Header brand
  sheet.mergeCells('A1', `${String.fromCharCode(64 + columns.length)}1`);
  const brandCell = sheet.getCell('A1');
  brandCell.value = BRAND.toUpperCase();
  brandCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  brandCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B6E4F' } };
  brandCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 26;

  sheet.mergeCells('A2', `${String.fromCharCode(64 + columns.length)}2`);
  const titleCell = sheet.getCell('A2');
  titleCell.value = title;
  titleCell.font = { size: 12, bold: true, color: { argb: 'FF1F2937' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  if (subtitle) {
    sheet.mergeCells('A3', `${String.fromCharCode(64 + columns.length)}3`);
    const subCell = sheet.getCell('A3');
    subCell.value = subtitle;
    subCell.font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  const headerRow = sheet.addRow(columns);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B6E4F' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' },
  };

  rows.forEach((row) => {
    const r = sheet.addRow(row);
    r.border = { bottom: { style: 'hair' } };
  });

  sheet.columns.forEach((col, i) => {
    col.width = Math.max(
      14,
      Math.min(40, String(columns[i] || '').length + 4, ...rows.map((r) => String(r[i] ?? '').length + 4))
    );
  });

  return workbook.xlsx.writeBuffer();
};

/**
 * Generate file PDF dari array of object (tabel sederhana).
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.subtitle]
 * @param {string[]} opts.columns
 * @param {Array<Array>} opts.rows
 * @param {Array<{label:string, value:string}>} [opts.summary] - ringkasan di atas tabel
 * @returns {Promise<Buffer>}
 */
const generatePdf = async ({ title, subtitle, columns, rows, summary = [] }) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fillColor(GREEN).rect(40, 40, doc.page.width - 80, 46).fill();
      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text(BRAND.toUpperCase(), 0, 56, { align: 'center' });
      doc.moveDown(1.6);

      doc.fillColor(DARK).fontSize(13).font('Helvetica-Bold').text(title, { align: 'center' });
      if (subtitle) {
        doc.fillColor('#6B7280').fontSize(9).font('Helvetica').text(subtitle, { align: 'center' });
      }
      doc.moveDown(0.6);

      if (summary.length > 0) {
        doc.fontSize(9).font('Helvetica');
        summary.forEach((s) => {
          doc.fillColor('#374151').text(`${s.label}: `, { continued: true });
          doc.fillColor(DARK).font('Helvetica-Bold').text(s.value);
          doc.font('Helvetica');
        });
        doc.moveDown(0.5);
      }

      // Tabel
      const tableTop = doc.y + 6;
      const colWidth = Math.min((doc.page.width - 80) / columns.length, 140);
      const rowH = 20;

      // header background
      doc.fillColor(GREEN).rect(40, tableTop, columns.length * colWidth, rowH).fill();
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      columns.forEach((c, i) => {
        doc.text(String(c), 44 + i * colWidth, tableTop + 6, { width: colWidth - 8, ellipsis: true });
      });

      doc.font('Helvetica').fontSize(8);
      let y = tableTop + rowH;
      rows.forEach((row, rIdx) => {
        if (rIdx % 2 === 0) {
          doc.fillColor('#F0FDF4').rect(40, y, columns.length * colWidth, rowH).fill();
        }
        row.forEach((cell, i) => {
          doc.fillColor(DARK).text(String(cell ?? ''), 44 + i * colWidth, y + 6, { width: colWidth - 8, ellipsis: true });
        });
        y += rowH;
        // page break sederhana
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = 60;
        }
      });

      // Footer
      const pages = doc.bufferedPageCount;
      for (let i = 0; i < pages; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor('#9CA3AF').font('Helvetica').text(
          `${BRAND} - Dibuat ${new Date().toLocaleString('id-ID')} - Halaman ${i + 1}/${pages}`,
          40, doc.page.height - 30, { align: 'center', width: doc.page.width - 80 }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

/**
 * Set header response untuk download file.
 */
const setDownloadHeaders = (res, { filename, mime }) => {
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
};

module.exports = { generateExcel, generatePdf, setDownloadHeaders };
