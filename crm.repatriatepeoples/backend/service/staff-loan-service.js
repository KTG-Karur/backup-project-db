"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const { generateSerialNumber } = require('../utils/utility');

async function getStaffLoan(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffLoanId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` lo.staff_loan_id = ${query.staffLoanId}`;
      }
      if (query.loanStatusId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` lo.loan_status_id = ${query.loanStatusId}`;
      }
      if (query.staffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` s.staff_id = ${query.staffId}`;
      }
      //   if (query.branchId) {
      //     iql += count >= 1 ? ` AND` : ``;
      //     count++;
      //     iql += ` lo.branch_id = ${query.branchId}`;
      //   }

      if (query.branchId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        if (query.branchId.includes(',')) {
          const branchIds = query.branchId.split(',')
            .map(id => id.trim())
            .filter(id => id !== '');

          if (branchIds.length > 0) {
            const orConditions = branchIds.map(id => `lo.branch_id = ${id}`).join(' OR ');
            iql += ` (${orConditions})`;
          }
        } else {
          iql += ` lo.branch_id = ${query.branchId}`;
        }
      }
    }
    const result = await sequelize.query(`
      SELECT 
      lo.staff_loan_id "staffLoanId",
      lo.loan_no "loanNo",
      lo.staff_id "staffId",
      s.staff_code "staffCode",
      s.staff_profile_image_name AS "staffProfile",
      s.contact_no "contactNo",
      s.address "address",
      dp.department_name "departmentName",
      ds.designation_name "designationName",
      CONCAT(s.first_name,' ',s.last_name) as staffName,
      s2.staff_id "approvedBy",
      s2.staff_code "approvedByCode",
      CONCAT(s2.first_name,' ',s2.last_name) as approvedByName,
      s3.staff_id "disbursedBy",
      s3.staff_code "disbursedByCode",
      CONCAT(s3.first_name,' ',s3.last_name) as disbursedByName,
      s4.staff_id "cancelledBy",
      s4.staff_code "cancelledByCode",
      CONCAT(s4.first_name,' ',s4.last_name) as cancelledByName,
      lo.interest_rate "interestRate", 
      lo.loan_amount "loanAmount", 
      lo.process_fees "processFees", 
      lo.disbursed_type_id "disbursedTypeId", 
      sl.status_name "disbursedTypeName", 
      lo.tenure_period "tenurePeriod", 
      lo.loan_status_id "loanStatusId", 
      sli.status_name "loanStatusName", 
      lo.cancelled_reason "cancelledReason", 
      lo.bank_id "bankId", 
      bc.bank_account_id  "bankAccountId", 
      bc.account_holder_name "accountHolderName", 
      bc.bank_name "bankName", 
      bc.branch_name "branchName", 
      bc.ifsc_code "ifscCode", 
      bc.account_no "accountNo", 
      lo.loan_date "loanDate", 
      lo.approved_date "approvedDate",
      lo.cancelled_date "cancelledDate",
      lo.disbursed_date "disbursedDate",
      lo.is_active "isActive"
      FROM staff_loans lo
      left join bank_accounts bc on bc.bank_account_id = lo.bank_id
      left join staffs s on s.staff_id = lo.staff_id 
      left join staffs s2 on s2.staff_id = lo.approved_by
      left join staffs s3 on s3.staff_id = lo.disbursed_by
      left join staffs s4 on s4.staff_id = lo.cancelled_by
      left join status_lists sl on sl.status_list_id = lo.disbursed_type_id
      left join status_lists sli on sli.status_list_id = lo.loan_status_id
      left join department dp on dp.department_id  = s.department_id
      left join designation ds on ds.designation_id  = s.designation_id
      ${iql} 
      ORDER BY staff_loan_id DESC`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function getLoanPaymentHistory(query) {
  try {
    if (!query?.staffLoanId) throw new Error("Missing staffLoanId");

    // Fetch loan info
    const loan = (await sequelize.query(`
      SELECT loan_amount, interest_rate, tenure_period
      FROM staff_loans
      WHERE staff_loan_id = ${query.staffLoanId}
      LIMIT 1
    `, { type: QueryTypes.SELECT }))[0];

    if (!loan) throw new Error("Loan not found");

    const P = parseFloat(loan.loan_amount);
    const annualRate = parseFloat(loan.interest_rate);
    const n = parseInt(loan.tenure_period);
    const r = annualRate / 12 / 100;

    // Calculate EMI (just for interest-principal split calculation)
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    let balance = P;

    // Fetch payments
    const payments = await sequelize.query(`
      SELECT 
        loan_payment_id AS "loanPaymentId",
        payment_date AS "paymentDate",
        payment_amount AS "paymentAmount",
        remark
      FROM loan_payments
      WHERE is_active = 1 AND staff_loan_id = ${query.staffLoanId}
      ORDER BY payment_date ASC
    `, { type: QueryTypes.SELECT });

    const history = [];

    for (const p of payments) {
      const payment = parseFloat(p.paymentAmount || 0);
      let interest = balance * r;
      let principal = 0;

      if (payment >= interest) {
        principal = payment - interest;
      } else {
        interest = payment;
        principal = 0;
      }

      balance -= principal;

      history.push({
        loanPaymentId: p.loanPaymentId,
        paymentDate: p.paymentDate,
        remark: p.remark,
        paymentAmount: Math.round(payment),
        interestAmount: Math.round(interest),
        principalAmount: Math.round(principal),
        balanceLoanAmount: Math.round(Math.max(0, balance)),
        loanAmount: P
      });
    }

    return history;

  } catch (err) {
    throw new Error(err.message || "Unable to fetch loan payment history");
  }
}

async function getLoanList(query) {
  try {
    let iql = "";
    let filter = [];

    if (query && Object.keys(query).length) {
      iql += `WHERE `;

      if (query.staffLoanId) {
        filter.push(` lo.staff_loan_id = ${query.staffLoanId}`);
      }

      if (query.isActive) {
        filter.push(` lo.is_active = ${query.isActive}`);
      }

      if (query.staffId) {
        filter.push(` s.staff_id = ${query.staffId}`);
      }

      if (query.branchId) {
        if (query.branchId.includes(',')) {
          const branchIds = query.branchId.split(',')
            .map(id => id.trim())
            .filter(id => id !== '');

          if (branchIds.length > 0) {
            const orConditions = branchIds.map(id => `lo.branch_id = ${id}`).join(' OR ');
            filter.push(` (${orConditions})`);
          }
        } else {
          filter.push(` lo.branch_id = ${query.branchId}`);
        }
      }

      filter.push(` lo.loan_status_id = 55`);
      iql += filter.length > 0 ? filter.join(" AND ") : '';
    }

    const loans = await sequelize.query(`
      SELECT 
        lo.staff_loan_id AS "staffLoanId",
      s.staff_profile_image_name AS "staffProfile",
        lo.loan_date AS "loanDate",
        lo.is_active AS "isActive",
        lo.loan_amount AS "loanAmount",
        lo.loan_no AS "loanNo",
        lo.staff_id AS "staffId",
        lo.interest_rate AS "interestRate",
        lo.tenure_period AS "tenurePeriod",
        CONCAT(s.first_name, ' ', s.last_name) AS "staffName",
        s.staff_code AS "staffCode"
      FROM staff_loans lo
      LEFT JOIN staffs s ON s.staff_id = lo.staff_id 
      ${iql}
      ORDER BY lo.staff_loan_id DESC
    `, {
      type: QueryTypes.SELECT,
      raw: true
    });

    const result = [];

    for (const loan of loans) {
      const P = parseFloat(loan.loanAmount);
      const r = parseFloat(loan.interestRate) / 12 / 100; // Monthly interest rate
      const n = parseInt(loan.tenurePeriod);

      let balance = P;
      let totalInterest = 0;
      let principalPaid = 0;
      let totalPaid = 0;

      const payments = await sequelize.query(`
        SELECT payment_amount AS "paymentAmount"
        FROM loan_payments
        WHERE is_active = 1 AND staff_loan_id = ${loan.staffLoanId}
        ORDER BY loan_payment_id ASC
      `, { type: QueryTypes.SELECT });

      for (const pay of payments) {
        let payment = parseFloat(pay.paymentAmount || 0);
        totalPaid += payment;

        const interest = balance * r;
        let principal = 0;

        if (payment >= interest) {
          principal = payment - interest;
        } else {
          principal = 0;
        }

        totalInterest += Math.min(payment, interest);
        principalPaid += principal;
        balance -= principal;
      }

      result.push({
        staffLoanId: loan.staffLoanId,
        loanDate: loan.loanDate,
        loanAmount: `${P}`,
        loanNo: loan.loanNo,
        staffId: loan.staffId,
        staffProfile: loan.staffProfile,
        staffName: loan.staffName,
        isActive: loan.isActive,
        staffCode: loan.staffCode,
        tenurePeriod: `${loan.tenurePeriod} (Month)`,
        totalPaidAmount: `${Math.round(totalPaid)}`,
        principalAmountPaid: `${Math.round(principalPaid)}`,
        totalInterestAmount: `${Math.round(totalInterest)}`,
        balancePrincipalAmount: `${Math.round(Math.max(0, balance))}`
      });
    }

    return result;

  } catch (error) {
    throw new Error(error.message || "Unable to fetch loan list");
  }
}


// async function getLoanList(query) {
//   try {
//     let iql = "";
//     let filter = [];

//     if (query && Object.keys(query).length) {
//       iql += `WHERE `;

//       if (query.staffLoanId) {
//         filter.push(` lo.staff_loan_id = ${query.staffLoanId}`)
//       }
//       if (query.isActive) {
//         filter.push(` lo.is_active = ${query.isActive}`)
//       }

//       if (query.staffId) {
//         filter.push(` s.staff_id = ${query.staffId}`)
//       }

//       if (query.branchId) {
//         if (query.branchId.includes(',')) {
//           const branchIds = query.branchId.split(',')
//             .map(id => id.trim())
//             .filter(id => id !== '');

//           if (branchIds.length > 0) {
//             const orConditions = branchIds.map(id => `lo.branch_id = ${id}`).join(' OR ');
//             filter.push(` (${orConditions})`);
//           }
//         } else {
//           filter.push(` lo.branch_id = ${query.branchId}`);
//         }
//       }

//       filter.push(` lo.loan_status_id = 55`);
//       iql += filter.length > 0 ? filter.join(" AND ") : '';
//     }

//     const loans = await sequelize.query(`
//       SELECT 
//         lo.staff_loan_id AS "staffLoanId",
//         lo.loan_date AS "loanDate",
//         lo.loan_amount AS "loanAmount",
//         lo.loan_no AS "loanNo",
//         lo.staff_id AS "staffId",
//         lo.interest_rate AS "interestRate",
//         lo.tenure_period AS "tenurePeriod",
//         CONCAT(s.first_name, ' ', s.last_name) AS "staffName",
//         s.staff_code AS "staffCode"
//       FROM staff_loans lo
//       LEFT JOIN staffs s ON s.staff_id = lo.staff_id 
//       ${iql}
//       ORDER BY lo.staff_loan_id DESC
//     `, {
//       type: QueryTypes.SELECT,
//       raw: true
//     });

//     const result = [];

//     for (const loan of loans) {
//       const P = parseFloat(loan.loanAmount);
//       const r = parseFloat(loan.interestRate) / 12 / 100;
//       const n = parseInt(loan.tenurePeriod);

//       const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
//       let balance = P;
//       let totalInterest = 0;
//       let principalPaid = 0;

//       const payments = await sequelize.query(`
//         SELECT payment_amount AS "paymentAmount"
//         FROM loan_payments
//         WHERE is_active = 1 AND staff_loan_id = ${loan.staffLoanId}
//         ORDER BY payment_date ASC
//       `, { type: QueryTypes.SELECT });

//       for (const pay of payments) {
//         const interest = balance * r;
//         const principal = emi - interest;

//         totalInterest += interest;
//         principalPaid += principal;
//         balance -= principal;
//       }

//       result.push({
//         staffLoanId: loan.staffLoanId,
//         loanDate: loan.loanDate,
//         loanAmount: `Rs. ${P}`,
//         loanNo: loan.loanNo,
//         staffId: loan.staffId,
//         staffName: loan.staffName,
//         staffCode: loan.staffCode,
//         tenurePeriod: `${loan.tenurePeriod} (Month)`,
//         totalPaidAmount: `Rs. ${Math.round(emi * payments.length)}`,
//         principalAmountPaid: `Rs. ${Math.round(principalPaid)}`,
//         totalInterestAmount: `Rs. ${Math.round(totalInterest)}`,
//         balancePrincipalAmount: `${Math.round(Math.max(0, balance))}`,
//       });
//     }

//     return result;

//   } catch (error) {
//     throw new Error(error.message || "Unable to fetch loan list");
//   }
// }



async function createLoanPayment(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const staffLoanResult = await sequelize.models.loan_payment.create(excuteMethod);
    const req = {
      staffLoanId: staffLoanResult.staff_loan_id
    }
    return await getLoanPaymentHistory(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createStaffLoan(postData) {
  try {
    const applicantCodeFormat = `K3WF-SL-`
    const countResult = await sequelize.query(
      `SELECT loan_no "loanNo" FROM staff_loans
          ORDER BY staff_loan_id  DESC LIMIT 1`,
      {
        type: QueryTypes.SELECT,
        raw: true,
        nest: false
      });

    const count = countResult.length > 0 ? parseInt(countResult[0].loanNo.split("-").pop()) : `00000`
    postData.loanNo = await generateSerialNumber(applicantCodeFormat, count)
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const staffLoanResult = await sequelize.models.staff_loan.create(excuteMethod);
    const req = {
      staffLoanId: staffLoanResult.staff_loan_id
    }
    return await getStaffLoan(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function deletePaymentHistory(loanPaymentId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key));
    const staffLoanResult = await sequelize.models.loan_payment.update(excuteMethod, { where: { loan_payment_id: loanPaymentId } });
    return true;
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffLoan(staffLoanId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key));
    const staffLoanResult = await sequelize.models.staff_loan.update(excuteMethod, { where: { staff_loan_id: staffLoanId } });
    const req = {
      staffLoanId: staffLoanId
    }
    return await getStaffLoan(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}


module.exports = {
  getStaffLoan,
  getLoanList,
  getLoanPaymentHistory,
  createLoanPayment,
  updateStaffLoan,
  deletePaymentHistory,
  createStaffLoan,
  // getStaffLoanLedger
};