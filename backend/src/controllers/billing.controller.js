const db = require('../config/db');
const { APIError } = require('../middlewares/error');
const crypto = require('crypto');
const visitService = require('../services/visit.service');

const billingController = {
  // Generate a new invoice
  createInvoice: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { patient_id, visit_id, items, discount_amount = 0, tax_amount = 0 } = req.body;

      if (!patient_id || !items || !Array.isArray(items) || items.length === 0) {
        throw new APIError('Patient ID and an array of items are required.', 400, 'BAD_REQUEST');
      }

      // Check if patient belongs to this clinic
      const [patient] = await db.query('SELECT id FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1', [patient_id, tenantId]);
      if (!patient) {
        throw new APIError('Patient record not found.', 404, 'PATIENT_NOT_FOUND');
      }

      // Calculate totals
      let totalAmount = 0;
      const processedItems = items.map(item => {
        const itemQty = parseInt(item.quantity, 10) || 1;
        const itemPrice = parseFloat(item.unit_price) || 0;
        const totalPrice = itemQty * itemPrice;
        totalAmount += totalPrice;

        return {
          item_type: item.item_type || 'other',
          item_reference_id: item.item_reference_id || null,
          item_description: item.item_description || 'Services Rendered',
          quantity: itemQty,
          unit_price: itemPrice,
          total_price: totalPrice
        };
      });

      const grandTotal = totalAmount + parseFloat(tax_amount) - parseFloat(discount_amount);

      // Insert invoice header
      const insertInvoiceSql = `
        INSERT INTO invoices (
          clinic_id, patient_id, visit_id, issued_date, total_amount, tax_amount, discount_amount, grand_total, status
        ) VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, 'unpaid')
      `;
      const invoiceResult = await db.query(insertInvoiceSql, [
        tenantId,
        patient_id,
        visit_id || null,
        totalAmount,
        tax_amount,
        discount_amount,
        grandTotal
      ]);
      const invoiceId = invoiceResult.insertId;

      // Insert invoice details
      const insertItemSql = `
        INSERT INTO invoice_items (
          clinic_id, invoice_id, item_type, item_reference_id, item_description, quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const item of processedItems) {
        await db.query(insertItemSql, [
          tenantId,
          invoiceId,
          item.item_type,
          item.item_reference_id,
          item.item_description,
          item.quantity,
          item.unit_price,
          item.total_price
        ]);
      }

      res.status(201).json({
        success: true,
        message: 'Invoice generated successfully.',
        data: {
          invoiceId,
          total_amount: totalAmount,
          grand_total: grandTotal,
          itemsCount: processedItems.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Fetch a single invoice by ID
  getInvoiceById: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const invoiceId = req.params.id;

      const [invoice] = await db.query('SELECT * FROM invoices WHERE id = ? AND clinic_id = ? LIMIT 1', [invoiceId, tenantId]);
      if (!invoice) {
        throw new APIError('Invoice record not found.', 404, 'INVOICE_NOT_FOUND');
      }

      const items = await db.query('SELECT * FROM invoice_items WHERE invoice_id = ? AND clinic_id = ?', [invoiceId, tenantId]);

      res.status(200).json({
        success: true,
        data: {
          ...invoice,
          items
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Initiate cash or online checkouts
  initiatePayment: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const cashierId = req.user.id;
      const { invoice_id, payment_method, amount_paid } = req.body;

      if (!invoice_id || !payment_method || !amount_paid) {
        throw new APIError('Invoice ID, payment method, and amount paid are required.', 400, 'BAD_REQUEST');
      }

      // Check invoice validity
      const [invoice] = await db.query('SELECT grand_total, status FROM invoices WHERE id = ? AND clinic_id = ? LIMIT 1', [invoice_id, tenantId]);
      if (!invoice) {
        throw new APIError('Invoice record not found.', 404, 'INVOICE_NOT_FOUND');
      }

      if (invoice.status === 'paid') {
        throw new APIError('This invoice has already been fully paid.', 400, 'INVOICE_ALREADY_PAID');
      }

      const amountToPay = parseFloat(amount_paid);
      const transactionRef = `TXN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

      // Immediate Cash Register Collections (receptionist counter receipt)
      if (payment_method === 'cash' || payment_method === 'bank_transfer') {
        // Log transaction immediately
        const insertPaymentSql = `
          INSERT INTO payments (
            clinic_id, invoice_id, amount_paid, payment_method, transaction_reference, payment_status, processed_by
          ) VALUES (?, ?, ?, ?, ?, 'completed', ?)
        `;
        await db.query(insertPaymentSql, [tenantId, invoice_id, amountToPay, payment_method, transactionRef, cashierId]);

        // Calculate if invoice is fully paid
        const newStatus = amountToPay >= parseFloat(invoice.grand_total) ? 'paid' : 'partially_paid';
        await db.query('UPDATE invoices SET status = ? WHERE id = ?', [newStatus, invoice_id]);

        if (newStatus === 'paid') {
          await billingController.handleInvoicePaid(invoice_id, tenantId, cashierId);
        }

        // Audit Trail log
        await db.query('INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id) VALUES (?, ?, "COLLECT_PAYMENT", "invoices", ?)', [tenantId, cashierId, invoice_id]);

        return res.status(200).json({
          success: true,
          status: 'completed',
          message: `Payment collected. Invoice status updated to ${newStatus}.`,
          transaction_reference: transactionRef
        });
      }

      // Online mobile money gateways (Chapa/Telebirr API checkout integration stubs)
      if (['chapa', 'telebirr', 'cbe_birr'].includes(payment_method)) {
        // Record pending transaction
        const insertPaymentSql = `
          INSERT INTO payments (
            clinic_id, invoice_id, amount_paid, payment_method, transaction_reference, payment_status, processed_by
          ) VALUES (?, ?, ?, ?, ?, 'pending', ?)
        `;
        await db.query(insertPaymentSql, [tenantId, invoice_id, amountToPay, payment_method, transactionRef, cashierId]);

        // Mock Checkout Links returned to redirect customer to input mobile PINs
        let redirectUrl = `https://mock.gateway.et/checkout/${transactionRef}`;
        if (payment_method === 'chapa') {
          redirectUrl = `https://checkout.chapa.co/checkout/test-session?ref=${transactionRef}&amount=${amountToPay}`;
        } else if (payment_method === 'telebirr') {
          redirectUrl = `https://telebirr.ethiopia/pay?merchantShortCode=654321&txnRef=${transactionRef}`;
        }

        return res.status(200).json({
          success: true,
          status: 'pending',
          redirectUrl,
          transaction_reference: transactionRef
        });
      }

      throw new APIError('Unsupported payment method.', 400, 'BAD_REQUEST');
    } catch (error) {
      next(error);
    }
  },

  // Webhook for online payment gateways notifications (Chapa / Telebirr IPN)
  paymentWebhook: async (req, res, next) => {
    try {
      const { transaction_reference, status } = req.body;
      const signature = req.headers['x-chapa-signature'] || req.headers['signature'];
      const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;

      if (!transaction_reference || !status) {
        throw new APIError('Missing transaction_reference or status in payload.', 400, 'BAD_REQUEST');
      }

      if (webhookSecret) {
        if (!signature) {
          throw new APIError('Webhook signature is required.', 401, 'INVALID_WEBHOOK_SIGNATURE');
        }
        const expected = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');
        if (signature !== expected) {
          throw new APIError('Invalid webhook signature.', 401, 'INVALID_WEBHOOK_SIGNATURE');
        }
      } else if (process.env.NODE_ENV === 'production') {
        throw new APIError('Payment webhook secret is not configured.', 500, 'WEBHOOK_MISCONFIGURED');
      }

      // Query transaction status in DB
      const [payment] = await db.query('SELECT * FROM payments WHERE transaction_reference = ? LIMIT 1', [transaction_reference]);
      if (!payment) {
        throw new APIError(`Transaction Reference '${transaction_reference}' not found.`, 404, 'TRANSACTION_NOT_FOUND');
      }

      if (payment.payment_status === 'completed') {
        return res.status(200).json({ success: true, message: 'Already processed transaction.' });
      }

      if (status === 'success' || status === 'completed') {
        // Mark payment completed
        await db.query('UPDATE payments SET payment_status = "completed" WHERE id = ?', [payment.id]);

        // Update corresponding invoice status
        const [invoice] = await db.query('SELECT grand_total, visit_id FROM invoices WHERE id = ? LIMIT 1', [payment.invoice_id]);
        if (invoice) {
          const newStatus = parseFloat(payment.amount_paid) >= parseFloat(invoice.grand_total) ? 'paid' : 'partially_paid';
          await db.query('UPDATE invoices SET status = ? WHERE id = ?', [newStatus, payment.invoice_id]);

          if (newStatus === 'paid') {
            await billingController.handleInvoicePaid(payment.invoice_id, payment.clinic_id, payment.processed_by);
          }
        }

        // Write to audit log
        await db.query('INSERT INTO audit_logs (clinic_id, action_type, affected_table, affected_record_id, remarks) VALUES (?, "PAYMENT_WEBHOOK_RECEIVED", "payments", ?, ?)', [
          payment.clinic_id,
          payment.id,
          `Webhook success for ${payment.payment_method}`
        ]);

        return res.status(200).json({ success: true, message: 'Payment applied successfully via webhook.' });
      } else {
        await db.query('UPDATE payments SET payment_status = "failed" WHERE id = ?', [payment.id]);
        return res.status(200).json({ success: true, message: 'Payment marked as failed.' });
      }
    } catch (error) {
      next(error);
    }
  },

  // List all invoices for the clinic tenant
  listInvoices: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { status, search, page = 1, limit = 10 } = req.query;

      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const limitVal = parseInt(limit, 10);

      let sql = `
        SELECT i.*, p.first_name, p.middle_name, p.last_name, p.mrn
        FROM invoices i
        JOIN patients p ON i.patient_id = p.id
        WHERE i.clinic_id = ?
      `;
      const params = [tenantId];

      if (status) {
        sql += ' AND i.status = ?';
        params.push(status);
      }

      if (search) {
        sql += ' AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.mrn LIKE ?)';
        const searchLike = `%${search}%`;
        params.push(searchLike, searchLike, searchLike);
      }

      sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
      params.push(limitVal, offset);

      const invoices = await db.query(sql, params);

      // Get total count for pagination
      let countSql = `
        SELECT COUNT(*) as total
        FROM invoices i
        JOIN patients p ON i.patient_id = p.id
        WHERE i.clinic_id = ?
      `;
      const countParams = [tenantId];

      if (status) {
        countSql += ' AND i.status = ?';
        countParams.push(status);
      }

      if (search) {
        countSql += ' AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.mrn LIKE ?)';
        const searchLike = `%${search}%`;
        countParams.push(searchLike, searchLike, searchLike);
      }

      const [countResult] = await db.query(countSql, countParams);
      const total = countResult ? countResult.total : 0;

      res.status(200).json({
        success: true,
        data: invoices,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: limitVal,
          pages: Math.ceil(total / limitVal)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all unbilled charges for a patient (consultations, labs, prescriptions)
  getUnbilledItems: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const patientId = req.params.patientId;

      // 1. Fetch unbilled consultations
      const consultationsSql = `
        SELECT c.id, c.consultation_datetime, c.chief_complaints,
               CONCAT(u.first_name, ' ', u.last_name) as doctor_name,
               v.id as visit_id
        FROM consultations c
        JOIN users u ON c.doctor_id = u.id
        LEFT JOIN visits v ON v.consultation_id = c.id
        WHERE c.patient_id = ? AND c.clinic_id = ?
          AND NOT EXISTS (
            SELECT 1 FROM invoice_items ii
            WHERE ii.item_type = 'consultation'
              AND ii.item_reference_id = c.id
          )
      `;
      const consultations = await db.query(consultationsSql, [patientId, tenantId]);
      
      const billedConsultations = consultations.map(c => ({
        id: c.id,
        visit_id: c.visit_id,
        item_type: 'consultation',
        item_reference_id: c.id,
        item_description: `Consultation Encounter - Dr. ${c.doctor_name} (${new Date(c.consultation_datetime).toLocaleDateString()})`,
        quantity: 1,
        unit_price: 200.00, // Standard Consultation Fee
        total_price: 200.00,
        date: c.consultation_datetime
      }));

      // 2. Fetch unbilled laboratory requests
      const labsSql = `
        SELECT lr.id, lr.request_date, lr.test_names,
               CONCAT(u.first_name, ' ', u.last_name) as doctor_name,
               v.id as visit_id
        FROM lab_requests lr
        JOIN users u ON lr.doctor_id = u.id
        LEFT JOIN visits v ON v.lab_request_id = lr.id
        WHERE lr.patient_id = ? AND lr.clinic_id = ?
          AND NOT EXISTS (
            SELECT 1 FROM invoice_items ii
            WHERE ii.item_type = 'laboratory'
              AND ii.item_reference_id = lr.id
          )
      `;
      const labRequests = await db.query(labsSql, [patientId, tenantId]);

      const LAB_PRICES = {
        'CBC': 150.00,
        'Malaria': 100.00,
        'AFB': 120.00,
        'Urinalysis': 80.00,
        'Stool Examination': 80.00,
        'Clinical Chemistry': 250.00
      };

      const billedLabs = [];
      for (const lr of labRequests) {
        let tests = [];
        try {
          tests = typeof lr.test_names === 'string' ? JSON.parse(lr.test_names) : lr.test_names;
          if (!Array.isArray(tests)) tests = [];
        } catch (e) {
          tests = [];
        }

        for (const test of tests) {
          const testPrice = LAB_PRICES[test] || 100.00; // Default price if not matching
          billedLabs.push({
            id: lr.id,
            visit_id: lr.visit_id,
            item_type: 'laboratory',
            item_reference_id: lr.id,
            item_description: `Laboratory Test: ${test} - Requested by Dr. ${lr.doctor_name}`,
            quantity: 1,
            unit_price: testPrice,
            total_price: testPrice,
            date: lr.request_date
          });
        }
      }

      // 3. Fetch unbilled prescriptions
      const prescriptionsSql = `
        SELECT pr.id, pr.prescribed_date, pr.instructions,
               CONCAT(u.first_name, ' ', u.last_name) as doctor_name,
               v.id as visit_id
        FROM prescriptions pr
        JOIN users u ON pr.doctor_id = u.id
        LEFT JOIN visits v ON v.prescription_id = pr.id
        WHERE pr.patient_id = ? AND pr.clinic_id = ?
          AND NOT EXISTS (
            SELECT 1 FROM invoice_items ii
            WHERE ii.item_type = 'pharmacy'
              AND ii.item_reference_id = pr.id
          )
      `;
      const prescriptions = await db.query(prescriptionsSql, [patientId, tenantId]);

      const billedPrescriptions = [];
      for (const pr of prescriptions) {
        let instructions = [];
        try {
          instructions = typeof pr.instructions === 'string' ? JSON.parse(pr.instructions) : pr.instructions;
          if (!Array.isArray(instructions)) instructions = [];
        } catch (e) {
          instructions = [];
        }

        for (const rx of instructions) {
          let medPrice = parseFloat(rx.unit_price) || 0;
          if (rx.medicine_id) {
            const [med] = await db.query('SELECT unit_price FROM medicines WHERE id = ? LIMIT 1', [rx.medicine_id]);
            if (med) {
              medPrice = parseFloat(med.unit_price);
            }
          }

          const rxQty = parseInt(rx.quantity, 10) || 1;
          const rxName = rx.medicine_name || rx.name || `Medicine ID: ${rx.medicine_id}`;
          billedPrescriptions.push({
            id: pr.id,
            visit_id: pr.visit_id,
            item_type: 'pharmacy',
            item_reference_id: pr.id,
            item_description: `Prescription: ${rxName} ${rx.strength || ''} - Qty: ${rxQty}`,
            quantity: rxQty,
            unit_price: medPrice,
            total_price: rxQty * medPrice,
            date: pr.prescribed_date
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          consultations: billedConsultations,
          laboratory: billedLabs,
          pharmacy: billedPrescriptions,
          summary: {
            consultationsCount: billedConsultations.length,
            laboratoryCount: billedLabs.length,
            pharmacyCount: billedPrescriptions.length,
            totalCount: billedConsultations.length + billedLabs.length + billedPrescriptions.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Process transitions when an invoice has been fully paid
  handleInvoicePaid: async (invoiceId, tenantId, actorId) => {
    try {
      const [invoice] = await db.query('SELECT visit_id FROM invoices WHERE id = ? AND clinic_id = ? LIMIT 1', [invoiceId, tenantId]);
      if (!invoice || !invoice.visit_id) {
        return; // No visit linked, skip status auto-transitions
      }

      const visitId = invoice.visit_id;
      const cashierId = actorId || 1;

      // Find all types of items in this invoice
      const items = await db.query('SELECT item_type FROM invoice_items WHERE invoice_id = ? AND clinic_id = ?', [invoiceId, tenantId]);
      
      const hasConsultation = items.some(item => item.item_type === 'consultation');
      const hasLaboratory = items.some(item => item.item_type === 'laboratory');
      const hasPharmacy = items.some(item => item.item_type === 'pharmacy');

      // Automate workflow transitions
      if (hasConsultation) {
        const [visit] = await db.query('SELECT visit_status FROM visits WHERE id = ? LIMIT 1', [visitId]);
        if (visit && visit.visit_status === 'REGISTERED') {
          await visitService.updateStatus(visitId, tenantId, 'CONSULTATION_PAID', cashierId);
          await visitService.updateStatus(visitId, tenantId, 'WAITING_DOCTOR', cashierId);
        }
      }

      if (hasLaboratory) {
        const [visit] = await db.query('SELECT visit_status FROM visits WHERE id = ? LIMIT 1', [visitId]);
        if (visit && visit.visit_status === 'LAB_PAYMENT_PENDING') {
          await visitService.updateStatus(visitId, tenantId, 'LAB_PAID', cashierId);
        }
      }

      if (hasPharmacy) {
        const [visit] = await db.query('SELECT visit_status FROM visits WHERE id = ? LIMIT 1', [visitId]);
        if (visit && (visit.visit_status === 'PRESCRIPTION_CREATED' || visit.visit_status === 'MEDICATION_PAYMENT_PENDING')) {
          if (visit.visit_status === 'PRESCRIPTION_CREATED') {
            await visitService.updateStatus(visitId, tenantId, 'MEDICATION_PAYMENT_PENDING', cashierId);
          }
          await visitService.updateStatus(visitId, tenantId, 'MEDICATION_PAID', cashierId);
        }
      }
    } catch (error) {
      console.error('[Billing Workflow Automation Error] Failed to process invoice transitions:', error);
    }
  }
};

module.exports = billingController;
