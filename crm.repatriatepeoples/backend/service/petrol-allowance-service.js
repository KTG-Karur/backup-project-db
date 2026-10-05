"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const moment = require("moment")
const { ACCESS_IDS, hasPageAccess } = require("./access-service");

async function getPetrolAllowance(query) {
  try {
    let filters = [];

    if (query && Object.keys(query).length) {
      if (query.petrolAllowanceId) {
        filters.push(`pa.petrol_allowance_id = ${query.petrolAllowanceId}`);
      }
      if (query.statusId) {
        filters.push(`pa.status_id = ${query.statusId}`);
      }
      if (query.departmentId && query.departmentId !== '0' && query.departmentId !== 0) {
        filters.push(`s.department_id = ${query.departmentId}`);
      }
      if (query.staffId) {
        filters.push(`pa.staff_id = ${query.staffId}`);
      }
      if (query.dateFilter) {
        const [Year, Month] = query.dateFilter.split("-");
        if (Month && Year) {
          filters.push(`YEAR(pa.allowance_date) = '${Year}' AND MONTH(pa.allowance_date) = '${Month}'`);
        } else if (Year) {
          filters.push(`YEAR(pa.allowance_date) = '${Year}'`);
        }
      }
      if (query.isActive) {
        filters.push(`pa.is_active = ${query.isActive}`);
      }
      if (query.fromDate) {
        filters.push(`( pa.allowance_date BETWEEN '${moment(query.fromDate).format('YYYY-MM-DD')} 00:00:00' AND '${moment(query.toDate).format('YYYY-MM-DD')} 23:59:59' )`);
      }
      if (query.branchId && query.branchId !== '0' && query.branchId !== 0 && query.branchId !== 'null') {
        if (String(query.branchId).includes(',')) {
          const branchIds = String(query.branchId).split(',')
            .map(id => id.trim())
            .filter(id => id !== '' && id !== '0');
          if (branchIds.length > 0) {
            const orConditions = branchIds.map(id => `FIND_IN_SET('${id}', s.branch_id) > 0`).join(' OR ');
            filters.push(`(${orConditions})`);
          }
        } else {
          filters.push(`FIND_IN_SET('${query.branchId}', s.branch_id) > 0`);
        }
      }
    }

    const iql = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    let result = await sequelize.query(`
  SELECT 
    pa.petrol_allowance_id AS "petrolAllowanceId",
    pa.staff_id AS "staffId",
    s.staff_code AS "staffCode",
    s.staff_profile_image_name AS "staffProfile",
    CONCAT(sur.status_name, '.', s.first_name, ' ', s.last_name) AS "staffName",
    s.vehicle_no AS "vehicleNo",
    des.designation_name AS "designationName",
    dep.department_name AS "departmentName",
    pa.allowance_date AS "allowanceDate",
    COALESCE(vp_from.visit_places_name, pa.from_place) AS "fromPlace",
    COALESCE(vp_to.visit_places_name, pa.to_place) AS "toPlace",
    pa.from_place AS "fromPlaceId",
    pa.to_place AS "toPlaceId",
    pa.activity_id AS "activityId",
    pa.is_active AS "isActive",
    pa.branch_id AS "branchId",
    pa.status_id AS "statusId",
    b.branch_name AS "branchName",
    s.branch_id AS "staffBranchId",
    COALESCE(b_staff.branch_name, bl_b.branch_name, bl.branch_name,
      (SELECT b3.branch_name FROM claims c3
       LEFT JOIN branches b3 ON b3.branch_id = c3.branch_id
       WHERE c3.requested_by = pa.staff_id AND c3.is_active = 1
       ORDER BY c3.createdAt DESC LIMIT 1)
    ) AS "staffBranchName",
    s.staff_code AS "staffCode",
    (
      SELECT GROUP_CONCAT(a.activity_name SEPARATOR ' & ')
      FROM activities a
      WHERE FIND_IN_SET(a.activity_id, pa.activity_id)
    ) AS "activityName",
    pa.total_km AS "totalKm",
    pa.total_amount AS "totalAmount",
    pa.bill_no AS "billNo",
    pa.name_of_dealer AS "nameOfDealer",
    pa.bill_image_name AS "billImageName",
    pa.createdAt AS "createdAt",
    pa.date_of_purchase AS "dateOfPurchase",
    pa.price_per_litre AS "pricePerLitre",
    pa.qty_per_litre AS "qtyPerLitre",
    pa.is_image_approved AS "isImageApproved"
  FROM petrol_allowances pa
  LEFT JOIN staffs s ON s.staff_id = pa.staff_id
  LEFT JOIN branches b ON b.branch_id = pa.branch_id
  LEFT JOIN branches b_staff ON b_staff.branch_id = s.branch_id
  LEFT JOIN branch_locations bl ON bl.staff_id = s.staff_id AND bl.is_active = 1
  LEFT JOIN branches bl_b ON bl_b.branch_id = bl.branch_id
  LEFT JOIN designation des ON des.designation_id = s.designation_id
  LEFT JOIN department dep ON dep.department_id = s.department_id
  LEFT JOIN status_lists sur ON sur.status_list_id = s.surname_id
  LEFT JOIN visit_places vp_from ON 
    vp_from.visit_places_id = CASE 
      WHEN pa.from_place REGEXP '^[0-9]+$' THEN pa.from_place 
      ELSE NULL 
    END
  LEFT JOIN visit_places vp_to ON 
    vp_to.visit_places_id = CASE 
      WHEN pa.to_place REGEXP '^[0-9]+$' THEN pa.to_place 
      ELSE NULL 
    END
  ${iql}
  GROUP BY pa.petrol_allowance_id
  ORDER BY pa.createdAt DESC`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    if (!query.petrolAllowanceId || String(query.petrolAllowanceId).startsWith('claim-')) {
      let claimIql = "WHERE c.claim_type_id IN (2, 4)";
      if (query && Object.keys(query).length) {
        if (query.petrolAllowanceId) claimIql += ` AND c.claim_id = ${String(query.petrolAllowanceId).replace('claim-', '')}`;
        if (query.statusId) claimIql += ` AND c.status_id = ${query.statusId}`;
        if (query.departmentId && query.departmentId !== '') claimIql += ` AND s.department_id = ${query.departmentId}`;
        if (query.staffId) claimIql += ` AND c.requested_by = ${query.staffId}`;
        if (query.dateFilter) {
          const [Year, Month] = query.dateFilter.split("-");
          if (Month && Year) {
            claimIql += ` AND YEAR(c.apply_date) = '${Year}' AND MONTH(c.apply_date) = '${Month}'`;
          } else if (Year) {
            claimIql += ` AND YEAR(c.apply_date) = '${Year}'`;
          }
        }
        if (query.isActive !== undefined) claimIql += ` AND c.is_active = ${query.isActive}`;
        if (query.fromDate) {
          claimIql += ` AND (c.apply_date BETWEEN '${moment(query.fromDate).format('YYYY-MM-DD')} 00:00:00' AND '${moment(query.toDate).format('YYYY-MM-DD')} 23:59:59')`;
        }
        if (query.branchId && query.branchId !== '0' && query.branchId !== 0 && query.branchId !== 'null') {
          if (String(query.branchId).includes(',')) {
            const branchIds = String(query.branchId).split(',').map(id => id.trim()).filter(id => id !== '' && id !== '0');
            if (branchIds.length > 0) {
              claimIql += ` AND (${branchIds.map(id => `FIND_IN_SET('${id}', s.branch_id) > 0`).join(' OR ')})`;
            }
          } else {
            claimIql += ` AND FIND_IN_SET('${query.branchId}', s.branch_id) > 0`;
          }
        }
      }

      const claimsResult = await sequelize.query(`
        SELECT 
          CONCAT('claim-', c.claim_id) AS "petrolAllowanceId",
          c.requested_by AS "staffId",
          s.staff_code AS "staffCode",
          s.staff_profile_image_name AS "staffProfile",
          CONCAT(IFNULL(sur.status_name, ''), '.', s.first_name, ' ', s.last_name) AS "staffName",
          s.vehicle_no AS "vehicleNo",
          des.designation_name AS "designationName",
          dep.department_name AS "departmentName",
          c.apply_date AS "allowanceDate",
          'N/A' AS "fromPlace",
          'N/A' AS "toPlace",
          NULL AS "fromPlaceId",
          NULL AS "toPlaceId",
          NULL AS "activityId",
          c.is_active AS "isActive",
          c.branch_id AS "branchId",
          c.status_id AS "statusId",
          b.branch_name AS "branchName",
          s.branch_id AS "staffBranchId",
          COALESCE(b_staff.branch_name, bl_b.branch_name, bl.branch_name,
            (SELECT b3.branch_name FROM claims c3
             LEFT JOIN branches b3 ON b3.branch_id = c3.branch_id
             WHERE c3.requested_by = c.requested_by AND c3.is_active = 1
             ORDER BY c3.createdAt DESC LIMIT 1)
          ) AS "staffBranchName",
          s.staff_code AS "staffCode",
          c.reason AS "activityName",
          0 AS "totalKm",
          c.requested_amount AS "totalAmount",
          NULL AS "billNo",
          NULL AS "nameOfDealer",
          c.recepit_image_name AS "billImageName",
          c.createdAt AS "createdAt",
          c.purchase_date AS "dateOfPurchase",
          0 AS "pricePerLitre",
          0 AS "qtyPerLitre",
          CASE WHEN c.status_id = 29 THEN 1 WHEN c.status_id = 30 THEN 0 ELSE 2 END AS "isImageApproved"
        FROM claims c
        LEFT JOIN staffs s ON s.staff_id = c.requested_by
        LEFT JOIN branches b ON b.branch_id = c.branch_id
        LEFT JOIN branches b_staff ON b_staff.branch_id = s.branch_id
        LEFT JOIN branch_locations bl ON bl.staff_id = s.staff_id AND bl.is_active = 1
        LEFT JOIN branches bl_b ON bl_b.branch_id = bl.branch_id
        LEFT JOIN designation des ON des.designation_id = s.designation_id
        LEFT JOIN department dep ON dep.department_id = s.department_id
        LEFT JOIN status_lists sur ON sur.status_list_id = s.surname_id
        ${claimIql}
        ORDER BY c.createdAt DESC
      `, { type: QueryTypes.SELECT, raw: true, nest: false });

      if (query.petrolAllowanceId && String(query.petrolAllowanceId).startsWith('claim-')) {
        result = claimsResult;
      } else {
        result = result.concat(claimsResult).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    }

    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : 'Operation error');
  }
}

async function getPetrolReportAllowance(query) {
  try {
    let conditions = [];
    let isSingleRecord = false;

    if (query && Object.keys(query).length) {
      if (query.petrolAllowanceId) {
        // If a specific petrol allowance ID is provided, only get that record
        conditions.push(`pa.petrol_allowance_id = '${query.petrolAllowanceId}'`);
        isSingleRecord = true;
      }
      
      if (query.staffId && !isSingleRecord) {
        conditions.push(`pa.staff_id = ${query.staffId}`);
      }

      if (query.fromDate && !isSingleRecord) {
        conditions.push(`(pa.allowance_date BETWEEN '${moment(query.fromDate).format('YYYY-MM-DD')} 00:00:00' AND '${moment(query.toDate).format('YYYY-MM-DD')} 23:59:59')`);
      }

      // If you want to add dateFilter again later, uncomment this block
      /*
      if (query.dateFilter) {
        conditions.push(`MONTH(pa.allowance_date) = '${moment(query.dateFilter).format("MM")}'`);
      }
      */
      if (query.branchId && query.branchId !== '0' && query.branchId !== 0 && query.branchId !== 'null' && !isSingleRecord) {
        if (String(query.branchId).includes(',')) {
          const branchIds = String(query.branchId).split(',')
            .map(id => id.trim())
            .filter(id => id !== '' && id !== '0');
          if (branchIds.length > 0) {
            const orConditions = branchIds.map(id => `FIND_IN_SET('${id}', s.branch_id) > 0`).join(' OR ');
            conditions.push(`(${orConditions})`);
          }
        } else {
          conditions.push(`FIND_IN_SET('${query.branchId}', s.branch_id) > 0`);
        }
      }
    }
    if (query.isActive !== undefined && query.isActive !== '') {
      conditions.push(`pa.is_active = ${query.isActive}`);
    }

    // If requesting a single record, don't consolidate with GROUP_CONCAT
    if (isSingleRecord) {
      let iql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const result = await sequelize.transaction(async (t) => {
        return await sequelize.query(`
          SELECT 
            pa.petrol_allowance_id,
            pa.staff_id AS "staffId",
            s.staff_code AS "staffCode",
            s.staff_profile_image_name AS "staffProfile",
            CONCAT(COALESCE(sur.status_name, ''), '.', s.first_name, ' ', s.last_name) AS "staffName",
            s.vehicle_no AS "vehicleNo",
            des.designation_name AS "designationName",
            dep.department_name AS "departmentName",
            pa.allowance_date AS "allowanceDate",
            COALESCE(vp_from.visit_places_name, pa.from_place) AS "fromPlace",
            COALESCE(vp_to.visit_places_name, pa.to_place) AS "toPlace",
            pa.activity_id AS "activityId",
            b.branch_name AS "branchName",
            s.branch_id AS "staffBranchId",
            s.staff_code AS "staffCode",
            (
              SELECT GROUP_CONCAT(a.activity_name SEPARATOR ' & ')
              FROM activities a
              WHERE FIND_IN_SET(a.activity_id, pa.activity_id)
            ) AS "activityName",
            pa.total_km AS "totalKm",
            pa.total_amount AS "totalAmount",
            pa.bill_no AS "billNo",
            pa.name_of_dealer AS "nameOfDealer",
            pa.bill_image_name AS "billImageName",
            pa.is_image_approved AS "isImageApproved",
            pa.date_of_purchase AS "dateOfPurchase",
            pa.price_per_litre AS "pricePerLitre",
            pa.qty_per_litre AS "qtyPerLitre",
            pa.createdAt,
            pa.branch_id,
            COALESCE(b.branch_name, b2.branch_name, bl_b.branch_name, bl.branch_name, 'N/A') AS "staffBranchName",
            JSON_OBJECT(
              'petrolAllowanceId', pa.petrol_allowance_id,
              'billNo', IFNULL(pa.bill_no, ''),
              'isImageApproved', IFNULL(pa.is_image_approved, 2),
              'dateOfPurchase', IFNULL(pa.date_of_purchase, ''),
              'nameOftheDealer', IFNULL(pa.name_of_dealer, ''),
              'billImageName', IFNULL(pa.bill_image_name, ''),
              'pricePerLitir', IFNULL(pa.price_per_litre, 0),
              'qtyPerLitre', IFNULL(pa.qty_per_litre, 0),
              'totalAmount', IFNULL(pa.total_amount, 0)
            ) AS billDetailsJson,
            JSON_OBJECT(
              'billNo', IFNULL(pa.bill_no, ''),
              'allowanceDate', IFNULL(pa.allowance_date, ''),
              'isImageApproved', IFNULL(pa.is_image_approved, 2),
              'fromPlace', IFNULL(
                CASE 
                  WHEN vp_from.visit_places_name IS NOT NULL THEN vp_from.visit_places_name
                  ELSE pa.from_place
                END, ''
              ),
              'toPlace', IFNULL(
                CASE 
                  WHEN vp_to.visit_places_name IS NOT NULL THEN vp_to.visit_places_name
                  ELSE pa.to_place
                END, ''
              ),
              'activityName', IFNULL((
                SELECT GROUP_CONCAT(a.activity_name SEPARATOR ' & ')
                FROM activities a
                WHERE FIND_IN_SET(a.activity_id, pa.activity_id)
              ), ''),
              'createdAt', IFNULL(pa.createdAt, ''),
              'totalKm', IFNULL(pa.total_km, 0),
              'totalAmount', IFNULL(pa.total_amount, 0)
            ) AS petrolPurchaseJson
          FROM (
            SELECT 
              pa.petrol_allowance_id,
              pa.staff_id,
              pa.allowance_date,
              pa.from_place,
              pa.to_place,
              pa.activity_id,
              pa.total_km,
              pa.total_amount,
              pa.bill_no,
              pa.name_of_dealer,
              pa.bill_image_name,
              pa.is_image_approved,
              pa.date_of_purchase,
              pa.price_per_litre,
              pa.qty_per_litre,
              pa.is_active,
              pa.createdAt,
              pa.branch_id
            FROM petrol_allowances pa
            UNION ALL
            SELECT 
              CONCAT('claim-', c.claim_id) AS petrol_allowance_id,
              c.requested_by AS staff_id,
              c.apply_date AS allowance_date,
              'N/A' AS from_place,
              'N/A' AS to_place,
              NULL AS activity_id,
              0 AS total_km,
              c.requested_amount AS total_amount,
              NULL AS bill_no,
              NULL AS name_of_dealer,
              c.recepit_image_name AS bill_image_name,
              CASE WHEN c.status_id = 29 THEN 1 WHEN c.status_id = 30 THEN 0 ELSE 2 END AS is_image_approved,
              c.purchase_date AS date_of_purchase,
              0 AS price_per_litre,
              0 AS qty_per_litre,
              c.is_active,
              c.createdAt,
              c.branch_id
            FROM claims c
            WHERE c.claim_type_id IN (2, 4)
          ) pa
          LEFT JOIN staffs s ON s.staff_id = pa.staff_id
          LEFT JOIN branches b ON b.branch_id = pa.branch_id
          LEFT JOIN branches b2 ON b2.branch_id = s.branch_id
          LEFT JOIN branch_locations bl ON bl.staff_id = s.staff_id AND bl.is_active = 1
          LEFT JOIN branches bl_b ON bl_b.branch_id = bl.branch_id
          LEFT JOIN designation des ON des.designation_id = s.designation_id
          LEFT JOIN department dep ON dep.department_id = s.department_id
          LEFT JOIN status_lists sur ON sur.status_list_id = s.surname_id
          LEFT JOIN visit_places vp_from ON 
            vp_from.visit_places_id = CASE 
              WHEN pa.from_place REGEXP '^[0-9]+$' THEN pa.from_place 
              ELSE NULL 
            END
          LEFT JOIN visit_places vp_to ON 
            vp_to.visit_places_id = CASE 
              WHEN pa.to_place REGEXP '^[0-9]+$' THEN pa.to_place 
              ELSE NULL 
            END
          ${iql}
        `, { type: QueryTypes.SELECT, raw: true, nest: false });
      });
      
      // Format result for single record with consolidation
      if (result.length > 0) {
        const row = result[0];
        return [{
          staffId: row.staffId,
          staffName: row.staffName,
          staffCode: row.staffCode,
          designationName: row.designationName,
          departmentName: row.departmentName,
          branchName: row.branchName,
          staffBranchName: row.staffBranchName,
          vehicleNo: row.vehicleNo,
          activityName: row.activityName,
          billDetails: JSON.stringify([row.billDetailsJson]),
          petrolPurchase: JSON.stringify([row.petrolPurchaseJson]),
        }];
      }
      return [];
    }

    let iql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await sequelize.transaction(async (t) => {
      await sequelize.query("SET SESSION group_concat_max_len = 1000000", { transaction: t });
      return await sequelize.query(`
  SELECT 
      pa.staff_id AS "staffId",
      CONCAT(COALESCE(sur.status_name, ''), '.', s.first_name, ' ', s.last_name) AS staffName,
      COALESCE(des.designation_name, 'N/A') AS "designationName",  
      COALESCE(dep.department_name, 'N/A') AS "departmentName",  
      COALESCE(b.branch_name, b2.branch_name, 'N/A') AS "branchName",  
      COALESCE(b.branch_name, b2.branch_name, bl_b.branch_name, bl.branch_name,
        (SELECT b3.branch_name FROM claims c3
         LEFT JOIN branches b3 ON b3.branch_id = c3.branch_id
         WHERE c3.requested_by = pa.staff_id AND c3.is_active = 1
         ORDER BY c3.createdAt DESC LIMIT 1),
        'N/A'
      ) AS "staffBranchName",  
      s.staff_code AS "staffCode",  
      s.vehicle_no AS "vehicleNo",
      GROUP_CONCAT(DISTINCT COALESCE(a.activity_name, pa.activity_name_fallback) SEPARATOR ' & ') AS "activityName",
      IFNULL(CONCAT('[', GROUP_CONCAT(
      DISTINCT CASE 
          WHEN pa.petrol_allowance_id LIKE 'claim-%' OR pa.bill_no IS NOT NULL OR pa.bill_image_name IS NOT NULL THEN
              CONCAT(
    '{"petrolAllowanceId":"', pa.petrol_allowance_id, '",',
    '"billNo":"', IFNULL(pa.bill_no, ''), '",',
    '"isImageApproved":', IFNULL(pa.is_image_approved, 2), ',',
    '"dateOfPurchase":"', IFNULL(pa.date_of_purchase, ''), '",',
    '"nameOftheDealer":"', REPLACE(IFNULL(pa.name_of_dealer, ''), '"', '\\"'), '",',
    '"billImageName":"', IFNULL(pa.bill_image_name, ''), '",', 
    '"pricePerLitir":"', IFNULL(pa.price_per_litre, '0'), '",', 
    '"qtyPerLitre":"', IFNULL(pa.qty_per_litre, '0'), '",', 
    '"totalAmount":', IFNULL(pa.total_amount, 0), '}'
)
          ELSE NULL
      END
      SEPARATOR ','
  ), ']'), '[]') AS billDetails,
    CONCAT('[', GROUP_CONCAT(
    CONCAT(
      '{"billNo":"', IFNULL(pa.bill_no, ''), '",',
      '"allowanceDate":"', IFNULL(pa.allowance_date, ''), '",',
       '"isImageApproved":', IFNULL(pa.is_image_approved, 2), ',',
      '"fromPlace":"', IFNULL(
        CASE 
          WHEN vp_from.visit_places_name IS NOT NULL THEN vp_from.visit_places_name
          ELSE pa.from_place
        END, ''
      ), '",',
      '"toPlace":"', REPLACE(IFNULL(
        CASE 
          WHEN vp_to.visit_places_name IS NOT NULL THEN vp_to.visit_places_name
          ELSE pa.to_place
        END, ''
      ), '"', '\\"'), '",',
      '"activityName":"', IFNULL(COALESCE(a.activity_name, pa.activity_name_fallback), ''), '",',
      '"createdAt":"', IFNULL(pa.createdAt, ''), '",',
      '"totalKm":"', IFNULL(pa.total_km, '0'), '",',
      '"totalAmount":', IFNULL(pa.total_amount, 0), '}'
    )
    ORDER BY pa.allowance_date DESC
    SEPARATOR ','
  ), ']') AS petrolPurchase
  FROM (
    SELECT 
      pa.petrol_allowance_id,
      pa.staff_id,
      pa.allowance_date,
      pa.from_place,
      pa.to_place,
      pa.activity_id,
      NULL AS activity_name_fallback,
      pa.total_km,
      pa.total_amount,
      pa.bill_no,
      pa.name_of_dealer,
      pa.bill_image_name,
      pa.is_image_approved,
      pa.date_of_purchase,
      pa.price_per_litre,
      pa.qty_per_litre,
      pa.is_active,
      pa.createdAt,
      pa.branch_id
    FROM petrol_allowances pa
    UNION ALL
    SELECT 
      CONCAT('claim-', c.claim_id) AS petrol_allowance_id,
      c.requested_by AS staff_id,
      c.apply_date AS allowance_date,
      'N/A' AS from_place,
      'N/A' AS to_place,
      NULL AS activity_id,
      c.reason AS activity_name_fallback,
      0 AS total_km,
      c.requested_amount AS total_amount,
      NULL AS bill_no,
      NULL AS name_of_dealer,
      c.recepit_image_name AS bill_image_name,
      CASE WHEN c.status_id = 29 THEN 1 WHEN c.status_id = 30 THEN 0 ELSE 2 END AS is_image_approved,
      c.purchase_date AS date_of_purchase,
      0 AS price_per_litre,
      0 AS qty_per_litre,
      c.is_active,
      c.createdAt,
      c.branch_id
    FROM claims c
    WHERE c.claim_type_id IN (2, 4)
  ) pa
  LEFT JOIN staffs s ON s.staff_id = pa.staff_id
  LEFT JOIN designation des ON des.designation_id = s.designation_id
  LEFT JOIN branches b ON b.branch_id = s.branch_id
  LEFT JOIN branches b2 ON b2.branch_id = pa.branch_id
  LEFT JOIN branch_locations bl ON bl.staff_id = s.staff_id AND bl.is_active = 1
  LEFT JOIN branches bl_b ON bl_b.branch_id = bl.branch_id
  LEFT JOIN status_lists sur ON sur.status_list_id = s.surname_id
  LEFT JOIN department dep ON dep.department_id = s.department_id
  LEFT JOIN activities a ON FIND_IN_SET(a.activity_id, pa.activity_id)
  LEFT JOIN visit_places vp_from ON 
    vp_from.visit_places_id = CASE 
      WHEN pa.from_place REGEXP '^[0-9]+$' THEN pa.from_place 
      ELSE NULL 
    END
  LEFT JOIN visit_places vp_to ON 
    vp_to.visit_places_id = CASE 
      WHEN pa.to_place REGEXP '^[0-9]+$' THEN pa.to_place 
      ELSE NULL 
    END
  ${iql} 
  GROUP BY pa.staff_id
  ORDER BY pa.allowance_date DESC
`, {
        transaction: t,
        type: QueryTypes.SELECT,
        raw: true,
        nest: false
      });
    });
    //AND pa.bill_no IS NOT NULL
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createPetrolAllowance(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const petrolAllowanceResult = await sequelize.models.petrol_allowance.create(excuteMethod);
    const req = {
      petrolAllowanceId: petrolAllowanceResult.petrol_allowance_id
    }
    return await getPetrolAllowance(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updatePetrolAllowance(petrolAllowanceId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const petrolAllowanceResult = await sequelize.models.petrol_allowance.update(excuteMethod, { where: { petrol_allowance_id: petrolAllowanceId } });
    const req = {
      petrolAllowanceId: petrolAllowanceId
    }
    return await getPetrolAllowance(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function approvePetrolAllowanceImage(petrolAllowanceId, user) {
  try {
    const allowed = await hasPageAccess(user.staffId, "/allowance/petrol-allowance", ACCESS_IDS.APPROVED);
    if (!allowed) {
      throw new Error('Not authorized to approve images');
    }

    const [updatedRows] = await sequelize.models.petrol_allowance.update(
      { is_image_approved: 1 },
      {
        where: {
          petrol_allowance_id: petrolAllowanceId,
          is_image_approved: [0, 2]
        }
      }
    );

    if (updatedRows === 0) {
      throw new Error('Petrol allowance record is already approved or not in a request state');
    }

    const req = { petrolAllowanceId: petrolAllowanceId };
    const [updatedRecord] = await getPetrolAllowance(req);
    return updatedRecord;
  } catch (error) {
    throw error;
  }
}

async function disapprovePetrolAllowanceImage(petrolAllowanceId, user) {
  try {
    const allowed = await hasPageAccess(user.staffId, "/allowance/petrol-allowance", ACCESS_IDS.REJECTED);
    if (!allowed) {
      throw new Error('Not authorized to disapprove images');
    }

    const [updatedRows] = await sequelize.models.petrol_allowance.update(
      { is_image_approved: 0 },
      {
        where: {
          petrol_allowance_id: petrolAllowanceId,
          is_image_approved: [1, 2]
        }
      }
    );

    if (updatedRows === 0) {
      throw new Error('Petrol allowance record is already disapproved or not in a request state');
    }

    const req = { petrolAllowanceId: petrolAllowanceId };
    const [updatedRecord] = await getPetrolAllowance(req);
    return updatedRecord;
  } catch (error) {
    throw error;
  }
}




module.exports = {
  getPetrolAllowance,
  getPetrolReportAllowance,
  updatePetrolAllowance,
  createPetrolAllowance,
  approvePetrolAllowanceImage,
  disapprovePetrolAllowanceImage
};