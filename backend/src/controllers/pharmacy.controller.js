const db = require('../config/db');
const { APIError } = require('../middlewares/error');
const visitService = require('../services/visit.service');

const pharmacyController = {
  // 1. List medicines with low-stock and expiry filters
  listMedicines: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { search, low_stock, near_expiry } = req.query;

      let sql = 'SELECT * FROM medicines WHERE clinic_id = ?';
      const params = [tenantId];

      if (search) {
        sql += ' AND (name LIKE ? OR generic_name LIKE ? OR sku LIKE ?)';
        const searchWildcard = `%${search}%`;
        params.push(searchWildcard, searchWildcard, searchWildcard);
      }

      if (low_stock === 'true' || low_stock === '1') {
        sql += ' AND quantity_in_stock <= reorder_level';
      }

      if (near_expiry === 'true' || near_expiry === '1') {
        sql += ' AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH) AND expiry_date >= CURDATE()';
      }

      sql += ' ORDER BY name ASC';

      const medicines = await db.query(sql, params);
      res.status(200).json({
        success: true,
        data: medicines
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. Add a new medicine item
  addMedicine: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const actorId = req.user.id;
      const { name, generic_name, strength, dosage_form, sku, quantity_in_stock, reorder_level, unit_price, expiry_date, batch_number, unit_cost } = req.body;

      if (!name || !generic_name || !strength || !dosage_form || !unit_price) {
        throw new APIError('Name, generic name, strength, dosage form, and unit price are required.', 400, 'BAD_REQUEST');
      }

      // Check unique SKU
      if (sku) {
        const [existingSku] = await db.query('SELECT id FROM medicines WHERE clinic_id = ? AND sku = ? LIMIT 1', [tenantId, sku]);
        if (existingSku) {
          throw new APIError('A medicine with this SKU already exists in this clinic.', 409, 'DUPLICATE_SKU');
        }
      }

      const insertSql = `
        INSERT INTO medicines (
          clinic_id, name, generic_name, strength, dosage_form, sku, quantity_in_stock, reorder_level, unit_price, expiry_date, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
      `;

      const initialQty = parseInt(quantity_in_stock, 10) || 0;

      const result = await db.query(insertSql, [
        tenantId,
        name.trim(),
        generic_name.trim(),
        strength.trim(),
        dosage_form.trim(),
        sku ? sku.trim() : null,
        initialQty,
        parseInt(reorder_level, 10) || 10,
        parseFloat(unit_price) || 0.00,
        expiry_date || null
      ]);

      const medicineId = result.insertId;

      // Log initial inventory transaction if quantity is greater than zero
      if (initialQty > 0) {
        const bNum = batch_number ? batch_number.trim() : `BATCH-${Date.now()}`;
        const expDate = expiry_date || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]; // Default 1 year
        const uCost = unit_cost !== undefined ? parseFloat(unit_cost) : parseFloat(unit_price) * 0.6; // Default unit cost

        // Insert batch record for EFDA compliance
        await db.query(
          'INSERT INTO medicine_batches (clinic_id, medicine_id, batch_number, expiry_date, quantity_received, quantity_remaining, unit_cost) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [tenantId, medicineId, bNum, expDate, initialQty, initialQty, uCost]
        );

        const txSql = `
          INSERT INTO inventory_transactions (
            clinic_id, medicine_id, transaction_type, quantity, remarks, performed_by
          ) VALUES (?, ?, 'purchase_receipt', ?, 'Initial stock configuration receipt', ?)
        `;
        await db.query(txSql, [tenantId, medicineId, initialQty, actorId]);
      }

      // Audit Log
      await db.query(
        'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id) VALUES (?, ?, "ADD_MEDICINE", "medicines", ?)',
        [tenantId, actorId, medicineId]
      );

      res.status(201).json({
        success: true,
        message: 'Medicine added to catalog successfully.',
        medicineId
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Update stock levels (Receipts or Adjustments)
  updateStock: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const actorId = req.user.id;
      const { medicine_id, quantity, transaction_type, remarks } = req.body;

      const validTxTypes = ['purchase_receipt', 'dispense', 'adjustment_loss', 'adjustment_gain', 'return'];
      if (!medicine_id || quantity === undefined || !transaction_type || !validTxTypes.includes(transaction_type)) {
        throw new APIError('Medicine ID, transaction quantity, and a valid transaction type are required.', 400, 'BAD_REQUEST');
      }

      // Check medicine existence
      const [medicine] = await db.query('SELECT id, quantity_in_stock FROM medicines WHERE id = ? AND clinic_id = ? LIMIT 1', [medicine_id, tenantId]);
      if (!medicine) {
        throw new APIError('Medicine not found in catalog.', 404, 'MEDICINE_NOT_FOUND');
      }

      const txQty = parseInt(quantity, 10);
      const newQty = medicine.quantity_in_stock + txQty;

      if (newQty < 0) {
        throw new APIError('Inventory stock levels cannot fall below zero.', 400, 'INSUFFICIENT_STOCK');
      }

      // If it is a purchase receipt, create a batch entry (EFDA compliance)
      if (transaction_type === 'purchase_receipt') {
        const { batch_number, expiry_date, unit_cost } = req.body;
        if (!batch_number || !expiry_date || unit_cost === undefined) {
          throw new APIError('Batch number, expiry date, and unit cost are required for purchase receipts.', 400, 'BAD_REQUEST');
        }
        
        const insertBatchSql = `
          INSERT INTO medicine_batches (
            clinic_id, medicine_id, batch_number, expiry_date, quantity_received, quantity_remaining, unit_cost
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(insertBatchSql, [
          tenantId,
          medicine_id,
          batch_number.trim(),
          expiry_date,
          txQty,
          txQty,
          parseFloat(unit_cost)
        ]);
      }

      // Update stock level
      await db.query('UPDATE medicines SET quantity_in_stock = ? WHERE id = ?', [newQty, medicine_id]);

      // Record transaction
      await db.query(
        'INSERT INTO inventory_transactions (clinic_id, medicine_id, transaction_type, quantity, remarks, performed_by) VALUES (?, ?, ?, ?, ?, ?)',
        [tenantId, medicine_id, transaction_type, txQty, remarks ? remarks.trim() : null, actorId]
      );

      // Audit
      await db.query(
        'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, remarks) VALUES (?, ?, "UPDATE_STOCK", "medicines", ?, ?)',
        [tenantId, actorId, medicine_id, `Stock updated via transaction type: ${transaction_type}`]
      );

      res.status(200).json({
        success: true,
        message: 'Medication stock updated successfully.',
        new_quantity: newQty
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. Dispense medication (deducts stock and checks linked prescriptions)
  dispenseMedicine: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const actorId = req.user.id;
      const { prescription_id, medicine_id, quantity } = req.body;

      if (!medicine_id || !quantity) {
        throw new APIError('Medicine ID and dispense quantity are required.', 400, 'BAD_REQUEST');
      }

      // Check payment status check lock (Pharmacy requires paid prescriptions or active corporate coverage)
      if (prescription_id) {
        const invoiceSql = `
          SELECT i.status, i.sponsor_id
          FROM invoice_items ii
          JOIN invoices i ON ii.invoice_id = i.id
          WHERE ii.item_type = 'pharmacy' AND ii.item_reference_id = ? AND ii.clinic_id = ?
          LIMIT 1
        `;
        const invoices = await db.query(invoiceSql, [prescription_id, tenantId]);
        if (!invoices || invoices.length === 0) {
          throw new APIError('Cannot dispense medication. Prescription has not been billed.', 402, 'BILLING_REQUIRED');
        }
        if (invoices[0].status !== 'paid' && !invoices[0].sponsor_id) {
          throw new APIError('Cannot dispense medication. Linked invoice is unpaid.', 402, 'PAYMENT_REQUIRED');
        }
      }

      // Check stock availability
      const [medicine] = await db.query('SELECT id, quantity_in_stock, name FROM medicines WHERE id = ? AND clinic_id = ? LIMIT 1', [medicine_id, tenantId]);
      if (!medicine) {
        throw new APIError('Medicine not found in catalog.', 404, 'MEDICINE_NOT_FOUND');
      }

      const dispenseQty = parseInt(quantity, 10);
      if (medicine.quantity_in_stock < dispenseQty) {
        throw new APIError(`Insufficient stock. Only ${medicine.quantity_in_stock} units of ${medicine.name} are available.`, 400, 'INSUFFICIENT_STOCK');
      }

      // Deduct from batches using FEFO ordering (EFDA compliance)
      let remainingToDispense = dispenseQty;
      const batches = await db.query(
        'SELECT id, quantity_remaining, batch_number FROM medicine_batches WHERE clinic_id = ? AND medicine_id = ? AND quantity_remaining > 0 ORDER BY expiry_date ASC',
        [tenantId, medicine_id]
      );
      
      if (!batches || batches.length === 0) {
        throw new APIError('No active medicine batches found with remaining stock. Adjust inventory first.', 400, 'NO_ACTIVE_BATCHES');
      }

      const totalAvailable = batches.reduce((sum, b) => sum + b.quantity_remaining, 0);
      if (totalAvailable < dispenseQty) {
        throw new APIError(`Insufficient stock across batches. Total batch stock: ${totalAvailable} units.`, 400, 'INSUFFICIENT_STOCK');
      }

      const batchDeductions = [];
      for (const batch of batches) {
        if (remainingToDispense <= 0) break;
        
        if (batch.quantity_remaining >= remainingToDispense) {
          const newBatchQty = batch.quantity_remaining - remainingToDispense;
          await db.query('UPDATE medicine_batches SET quantity_remaining = ? WHERE id = ?', [newBatchQty, batch.id]);
          batchDeductions.push({ batch_number: batch.batch_number, deducted: remainingToDispense });
          remainingToDispense = 0;
        } else {
          remainingToDispense -= batch.quantity_remaining;
          await db.query('UPDATE medicine_batches SET quantity_remaining = 0 WHERE id = ?', [batch.id]);
          batchDeductions.push({ batch_number: batch.batch_number, deducted: batch.quantity_remaining });
        }
      }

      // Deduct stock in general catalog table
      const newQty = medicine.quantity_in_stock - dispenseQty;
      await db.query('UPDATE medicines SET quantity_in_stock = ? WHERE id = ?', [newQty, medicine_id]);

      // Record transaction
      const remarks = prescription_id 
        ? `Dispensed for Prescription ID: ${prescription_id} (${batchDeductions.map(b => `${b.batch_number}:${b.deducted}`).join(', ')})` 
        : `Over-the-counter dispense (${batchDeductions.map(b => `${b.batch_number}:${b.deducted}`).join(', ')})`;
        
      const [txResult] = await db.query(
        'INSERT INTO inventory_transactions (clinic_id, medicine_id, transaction_type, quantity, remarks, performed_by) VALUES (?, ?, "dispense", ?, ?, ?)',
        [tenantId, medicine_id, -dispenseQty, remarks, actorId]
      );

      // If linked to prescription, update prescription record status
      if (prescription_id) {
        const [prescription] = await db.query('SELECT id FROM prescriptions WHERE id = ? AND clinic_id = ? LIMIT 1', [prescription_id, tenantId]);
        if (prescription) {
          await db.query('UPDATE prescriptions SET status = "dispensed" WHERE id = ?', [prescription_id]);

          // Transition visit status to DISPENSED and then CLOSED (closes the visit and completes queue entries)
          const [visit] = await db.query('SELECT id FROM visits WHERE prescription_id = ? AND clinic_id = ? LIMIT 1', [prescription_id, tenantId]);
          if (visit) {
            await visitService.updateStatus(visit.id, tenantId, 'DISPENSED', actorId);
            await visitService.updateStatus(visit.id, tenantId, 'CLOSED', actorId);
          }
        }
      }

      // Audit Log
      await db.query(
        'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, remarks) VALUES (?, ?, "DISPENSE_MEDICINE", "medicines", ?, ?)',
        [tenantId, actorId, medicine_id, `Dispensed ${dispenseQty} units of ${medicine.name}`]
      );

      res.status(200).json({
        success: true,
        message: 'Medication dispensed successfully.',
        transaction_id: txResult.insertId,
        new_quantity: newQty,
        batches_deducted: batchDeductions
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = pharmacyController;
