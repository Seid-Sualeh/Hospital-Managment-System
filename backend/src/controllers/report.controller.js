const db = require('../config/db');
const { APIError } = require('../middlewares/error');

// Helper to format date ranges
const getDateRange = (query) => {
  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30); // Default last 30 days

  const startDate = query.startDate ? new Date(query.startDate) : defaultStart;
  const endDate = query.endDate ? new Date(query.endDate) : defaultEnd;

  // Format as YYYY-MM-DD
  return [
    startDate.toISOString().split('T')[0] + ' 00:00:00',
    endDate.toISOString().split('T')[0] + ' 23:59:59'
  ];
};

const reportController = {
  // 1. Daily Patients Registration & Demographics
  getPatientsReport: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const [start, end] = getDateRange(req.query);

      // Registration timeline
      const dailySql = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM patients
        WHERE clinic_id = ? AND created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      const dailyRegistrations = await db.query(dailySql, [tenantId, start, end]);

      // Gender distribution
      const genderSql = `
        SELECT gender, COUNT(*) as count
        FROM patients
        WHERE clinic_id = ?
        GROUP BY gender
      `;
      const genderSplit = await db.query(genderSql, [tenantId]);

      // Age distribution groups
      const ageSql = `
        SELECT 
          CASE 
            WHEN TIMESTAMPDIFF(YEAR, dob_gregorian, CURDATE()) < 18 THEN 'Under 18'
            WHEN TIMESTAMPDIFF(YEAR, dob_gregorian, CURDATE()) BETWEEN 18 AND 35 THEN '18-35'
            WHEN TIMESTAMPDIFF(YEAR, dob_gregorian, CURDATE()) BETWEEN 36 AND 50 THEN '36-50'
            WHEN TIMESTAMPDIFF(YEAR, dob_gregorian, CURDATE()) BETWEEN 51 AND 65 THEN '51-65'
            ELSE '65+' 
          END AS age_group, 
          COUNT(*) as count
        FROM patients
        WHERE clinic_id = ?
        GROUP BY age_group
      `;
      const ageDistribution = await db.query(ageSql, [tenantId]);

      // Total count
      const [totalCountResult] = await db.query('SELECT COUNT(*) as total FROM patients WHERE clinic_id = ?', [tenantId]);
      const totalCount = totalCountResult ? totalCountResult.total : 0;

      res.status(200).json({
        success: true,
        data: {
          totalCount,
          dailyRegistrations,
          genderSplit,
          ageDistribution,
          dateRange: { start, end }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. Revenue collected, billed invoices & breakdowns
  getRevenueReport: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const [start, end] = getDateRange(req.query);

      // Total billed header
      const billedHeaderSql = `
        SELECT 
          COALESCE(SUM(total_amount), 0) as subtotal, 
          COALESCE(SUM(tax_amount), 0) as tax, 
          COALESCE(SUM(discount_amount), 0) as discount, 
          COALESCE(SUM(grand_total), 0) as grand_total 
        FROM invoices 
        WHERE clinic_id = ? AND issued_date BETWEEN ? AND ? AND status != 'void'
      `;
      const [billedHeader] = await db.query(billedHeaderSql, [tenantId, start, end]);

      // Total collected
      const collectedSql = `
        SELECT COALESCE(SUM(amount_paid), 0) as total_collected
        FROM payments
        WHERE clinic_id = ? AND payment_status = 'completed' AND payment_date BETWEEN ? AND ?
      `;
      const [collectedResult] = await db.query(collectedSql, [tenantId, start, end]);
      const totalCollected = collectedResult ? collectedResult.total_collected : 0;

      // Daily trends
      const dailyBillingSql = `
        SELECT issued_date as date, SUM(grand_total) as amount
        FROM invoices
        WHERE clinic_id = ? AND issued_date BETWEEN ? AND ? AND status != 'void'
        GROUP BY issued_date
        ORDER BY date ASC
      `;
      const dailyBillingTrend = await db.query(dailyBillingSql, [tenantId, start, end]);

      const dailyCollectionSql = `
        SELECT DATE(payment_date) as date, SUM(amount_paid) as amount
        FROM payments
        WHERE clinic_id = ? AND payment_status = 'completed' AND payment_date BETWEEN ? AND ?
        GROUP BY DATE(payment_date)
        ORDER BY date ASC
      `;
      const dailyCollectionTrend = await db.query(dailyCollectionSql, [tenantId, start, end]);

      // Payment method share
      const methodSql = `
        SELECT payment_method, SUM(amount_paid) as amount, COUNT(*) as count
        FROM payments
        WHERE clinic_id = ? AND payment_status = 'completed' AND payment_date BETWEEN ? AND ?
        GROUP BY payment_method
      `;
      const methodShare = await db.query(methodSql, [tenantId, start, end]);

      // Item type classification share (Consultation, Lab, Pharmacy etc)
      const itemBreakdownSql = `
        SELECT ii.item_type, SUM(ii.total_price) as amount, COUNT(*) as count
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        WHERE i.clinic_id = ? AND i.status = 'paid' AND i.issued_date BETWEEN ? AND ?
        GROUP BY ii.item_type
      `;
      const itemBreakdownShare = await db.query(itemBreakdownSql, [tenantId, start, end]);

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalBilled: billedHeader ? billedHeader.grand_total : 0,
            subtotalBilled: billedHeader ? billedHeader.subtotal : 0,
            taxBilled: billedHeader ? billedHeader.tax : 0,
            discountGiven: billedHeader ? billedHeader.discount : 0,
            totalCollected,
            outstandingBalance: (billedHeader ? billedHeader.grand_total : 0) - totalCollected
          },
          trends: {
            billing: dailyBillingTrend,
            collections: dailyCollectionTrend
          },
          paymentMethods: methodShare,
          serviceBreakdown: itemBreakdownShare,
          dateRange: { start, end }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Laboratory requests & test distribution
  getLabsReport: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const [start, end] = getDateRange(req.query);

      // Status splits
      const statusSql = `
        SELECT status, COUNT(*) as count
        FROM lab_requests
        WHERE clinic_id = ? AND request_date BETWEEN ? AND ?
        GROUP BY status
      `;
      const statusDistribution = await db.query(statusSql, [tenantId, start, end]);

      // Test name frequency counter (Aggregating JSON arrays in Javascript)
      const testsSql = `
        SELECT test_names
        FROM lab_requests
        WHERE clinic_id = ? AND request_date BETWEEN ? AND ? AND status != 'cancelled'
      `;
      const requests = await db.query(testsSql, [tenantId, start, end]);

      const testFrequency = {};
      requests.forEach(row => {
        let tests = [];
        try {
          tests = typeof row.test_names === 'string' ? JSON.parse(row.test_names) : row.test_names;
          if (!Array.isArray(tests)) tests = [];
        } catch (e) {
          tests = [];
        }
        tests.forEach(test => {
          testFrequency[test] = (testFrequency[test] || 0) + 1;
        });
      });

      // Format to list
      const formattedFrequency = Object.keys(testFrequency).map(key => ({
        test_name: key,
        count: testFrequency[key]
      })).sort((a, b) => b.count - a.count);

      // Doctor request volumes
      const docSql = `
        SELECT CONCAT(u.first_name, ' ', u.last_name) as doctor_name, COUNT(*) as count
        FROM lab_requests lr
        JOIN users u ON lr.doctor_id = u.id
        WHERE lr.clinic_id = ? AND lr.request_date BETWEEN ? AND ?
        GROUP BY lr.doctor_id
      `;
      const doctorLoad = await db.query(docSql, [tenantId, start, end]);

      res.status(200).json({
        success: true,
        data: {
          statusDistribution,
          testFrequency: formattedFrequency,
          doctorLoad,
          dateRange: { start, end }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. Medicine Stock & Expiry Ledger
  getInventoryReport: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const [start, end] = getDateRange(req.query);

      // Current stock listing
      const medicinesSql = `
        SELECT id, name, generic_name, sku, quantity_in_stock, reorder_level, unit_price, expiry_date
        FROM medicines
        WHERE clinic_id = ?
        ORDER BY quantity_in_stock ASC
      `;
      const currentStock = await db.query(medicinesSql, [tenantId]);

      // Stock alerts count
      const [lowStockResult] = await db.query('SELECT COUNT(*) as count FROM medicines WHERE clinic_id = ? AND quantity_in_stock <= reorder_level AND is_active = TRUE', [tenantId]);
      const [expiredResult] = await db.query('SELECT COUNT(*) as count FROM medicines WHERE clinic_id = ? AND expiry_date < CURDATE()', [tenantId]);
      const [nearExpiryResult] = await db.query('SELECT COUNT(*) as count FROM medicines WHERE clinic_id = ? AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)', [tenantId]);

      // Transaction breakdown log
      const transSql = `
        SELECT transaction_type, SUM(ABS(quantity)) as total_quantity, COUNT(*) as count
        FROM inventory_transactions
        WHERE clinic_id = ? AND transaction_date BETWEEN ? AND ?
        GROUP BY transaction_type
      `;
      const transactionVolume = await db.query(transSql, [tenantId, start, end]);

      res.status(200).json({
        success: true,
        data: {
          currentStock,
          alerts: {
            lowStock: lowStockResult ? lowStockResult.count : 0,
            expired: expiredResult ? expiredResult.count : 0,
            nearExpiry: nearExpiryResult ? nearExpiryResult.count : 0
          },
          transactionVolume,
          dateRange: { start, end }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. Appointments scheduling & clinic load
  getAppointmentsReport: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const [start, end] = getDateRange(req.query);

      // Status splits
      const statusSql = `
        SELECT status, COUNT(*) as count
        FROM appointments
        WHERE clinic_id = ? AND appointment_datetime BETWEEN ? AND ?
        GROUP BY status
      `;
      const statusDistribution = await db.query(statusSql, [tenantId, start, end]);

      // Doctor appointment loadings
      const docSql = `
        SELECT CONCAT(u.first_name, ' ', u.last_name) as doctor_name, COUNT(*) as count
        FROM appointments a
        JOIN users u ON a.doctor_id = u.id
        WHERE a.clinic_id = ? AND a.appointment_datetime BETWEEN ? AND ?
        GROUP BY a.doctor_id
      `;
      const doctorLoad = await db.query(docSql, [tenantId, start, end]);

      // Daily appointment metrics
      const dailySql = `
        SELECT DATE(appointment_datetime) as date, COUNT(*) as count
        FROM appointments
        WHERE clinic_id = ? AND appointment_datetime BETWEEN ? AND ?
        GROUP BY DATE(appointment_datetime)
        ORDER BY date ASC
      `;
      const dailyTrend = await db.query(dailySql, [tenantId, start, end]);

      res.status(200).json({
        success: true,
        data: {
          statusDistribution,
          doctorLoad,
          dailyTrend,
          dateRange: { start, end }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 6. HMIS disease statistics tally sheet (Ethiopian Ministry of Health Standard)
  getHMISTallySheet: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const [start, end] = getDateRange(req.query);

      const sql = `
        SELECT c.diagnoses, p.gender, TIMESTAMPDIFF(YEAR, p.dob_gregorian, c.consultation_datetime) as age
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        WHERE c.clinic_id = ? AND c.consultation_datetime BETWEEN ? AND ? AND c.status = 'completed'
      `;
      const consultations = await db.query(sql, [tenantId, start, end]);

      const tally = {};

      consultations.forEach(row => {
        let diagnosesList = [];
        try {
          diagnosesList = typeof row.diagnoses === 'string' ? JSON.parse(row.diagnoses) : row.diagnoses;
          if (!Array.isArray(diagnosesList)) diagnosesList = [];
        } catch (e) {
          diagnosesList = [];
        }

        diagnosesList.forEach(diag => {
          if (!diag || !diag.code) return;
          
          const code = diag.code.toUpperCase().split('.')[0]; // Group by root code, e.g., A09
          const name = diag.name || 'Unknown Diagnosis';

          if (!tally[code]) {
            tally[code] = {
              code,
              name,
              under1_m: 0, under1_f: 0,
              age1_4_m: 0, age1_4_f: 0,
              age5_14_m: 0, age5_14_f: 0,
              age15_49_m: 0, age15_49_f: 0,
              age50plus_m: 0, age50plus_f: 0,
              total: 0
            };
          }

          const age = row.age || 0;
          const gender = row.gender === 'F' ? 'f' : 'm';
          
          let bracket = '';
          if (age < 1) bracket = 'under1';
          else if (age >= 1 && age <= 4) bracket = 'age1_4';
          else if (age >= 5 && age <= 14) bracket = 'age5_14';
          else if (age >= 15 && age <= 49) bracket = 'age15_49';
          else bracket = 'age50plus';

          const cell = `${bracket}_${gender}`;
          tally[code][cell] += 1;
          tally[code].total += 1;
        });
      });

      const data = Object.values(tally).sort((a, b) => b.total - a.total);

      res.status(200).json({
        success: true,
        data,
        dateRange: { start, end }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reportController;
