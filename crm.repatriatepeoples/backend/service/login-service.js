"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const fastify = require("../app");
const { QueryTypes } = require('sequelize');
const { decrptPassword } = require('../utils/utility');
const { getRolePermission } = require('./role-permission-service');
const { getPage } = require('./page-service');
const moment = require("moment");


const currentTimeIST = moment.utc().add(5, 'hours').add(30, 'minutes'); // Get current IST time
const currentHour = currentTimeIST.hour();
// const toDayDate = moment().format('YYYY-MM-DD');

async function getEmployeeLogin(query) {
    try {
        let filters = [];
        if (query && Object.keys(query).length) {
            if (query.userName) {
                filters.push(`u.user_name = '${query.userName}'`);
            }
        }
        filters.push(`s.is_active = 1`);
        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
        const result = await sequelize.query(`SELECT u.user_id "userId", user_name "userName", password,s.staff_id "staffId", s.staff_code "staffCode", s.staff_profile_image_name AS "staffProfile",s.branch_id "branchId",CONCAT(s.first_name,' ',s.last_name) as staffName,
            r.role_name "roleName",r.role_id "roleId"
            FROM users u
            left join staffs s on s.user_id = u.user_id 
            left join role r on r.role_id = s.role_id  ${whereClause}`, {
            type: QueryTypes.SELECT,
            raw: true,
            nest: false
        });

        if (result.length > 0) {
            const roleId = result[0].roleId;
            if (roleId == 1 || (currentHour >= 6 && currentHour < 19)) { //19
                const decrptPasswordData = await decrptPassword(result[0]?.password)
                if (decrptPasswordData === query.password) {
                    const queryReq = {
                        roleId: result[0].roleId
                    }
                    const rolePermission = await getRolePermission(queryReq)
                    const pagesList = await getPage()

                    const rolePermissionData = JSON.parse(rolePermission[0].accessIds)
                    const rolePermissionArr = rolePermissionData.access
                    const pagesData = [];
                    let titleReq = {}
                    const filterData = pagesList.forEach((page) => {
                        if (page.isTitle === 1) {
                            titleReq = {
                                pageId: page.pageId,
                                label: page.title,
                                isTitle: true
                            };
                        }

                        const permissionPage = _.filter(rolePermissionArr, (o) => {
                            const titlePushed = pagesData.find(obj => obj.pageId === titleReq?.pageId);

                            if (o.pageId === page.pageId) {
                                if (!titlePushed) {
                                    pagesData.push(titleReq);
                                }

                                if (page.parentId) {
                                    let parentChecker = pagesData.find(obj => obj.pageId === page.parentId);

                                    if (parentChecker) {
                                        // Parent exists, push child under it
                                        parentChecker.children = parentChecker.children || [];
                                        parentChecker.children.push({
                                            label: page.pageName,
                                            url: page.pageUrl,
                                            parentKey: parentChecker.label,
                                            access: o.accessPermission.join(', ')
                                        });
                                    } else {
                                        // Parent doesn't exist, find from `pagesList`
                                        let parentObject = _.find(pagesList, { pageId: page.parentId });

                                        if (parentObject) {
                                            let data = {
                                                pageId: parentObject.pageId,
                                                label: parentObject.pageName,
                                                isTitle: false,
                                                icon: parentObject.iconName,
                                                children: [
                                                    {
                                                        label: page.pageName,
                                                        url: page.pageUrl,
                                                        parentKey: parentObject.pageName,
                                                        access: o.accessPermission.join(', ')
                                                    }
                                                ]
                                            };
                                            pagesData.push(data);
                                        }
                                    }
                                } else if (page.pageUrl) {
                                    // Add as standalone if no parent
                                    pagesData.push({
                                        pageId: page.pageId,
                                        label: page.pageName,
                                        isTitle: false,
                                        icon: page.iconName,
                                        url: page.pageUrl,
                                        access: o.accessPermission.join(', ')
                                    });
                                }
                            }
                        });
                    });
                    let staffViewFlag = rolePermissionArr.some(item =>
                        item.pageId === 17 && item.accessPermission.includes(8)
                    );
                    let permissionFlag = rolePermissionArr.some(item =>
                        item.pageId === 36 && item.accessPermission.includes(8)
                    );
                    let visitEntryFlag = rolePermissionArr.some(item =>
                        item.pageId === 7 && item.accessPermission.includes(8)
                    );
                    let petrolAllowanceFlag = rolePermissionArr.some(item =>
                        item.pageId === 8 && item.accessPermission.includes(8)
                    );

                    // if (roleId != 1) {
                    //     const [attendanceRes] = await sequelize.query(`
                    //     SELECT * FROM staff_attendances 
                    //     WHERE staff_id = ${result[0].staffId} 
                    //     AND attendance_date = '${toDayDate}' 
                    //     AND attendance_status_id = 1
                    // `, {
                    //         type: QueryTypes.SELECT,
                    //         raw: true
                    //     });

                    //     const attendanceAccess = rolePermissionArr.find(
                    //         (r) => r.pageId === 2 && (r.accessPermission.includes(8) || r.accessPermission.includes(1) || r.accessPermission.includes(2))
                    //     );

                    //     // Not attended yet
                    //     if (!attendanceRes) {
                    //         if (attendanceAccess) {
                    //             // Has access to attendance, show only that
                    //             pagesData.length = 0;
                    //             const attendancePage = pagesList.find(p => p.pageId === 2);
                    //             if (attendancePage) {
                    //                 pagesData.push({
                    //                     pageId: attendancePage.pageId,
                    //                     label: attendancePage.pageName,
                    //                     isTitle: false,
                    //                     icon: attendancePage.iconName,
                    //                     url: attendancePage.pageUrl,
                    //                     access: attendanceAccess.accessPermission.join(', ')
                    //                 });
                    //             }
                    //         } else {
                    //             // No attendance, and no access — show nothing
                    //             pagesData.length = 0;
                    //         }
                    //     }
                    // }

                    const token = fastify.jwt.sign({
                        email: result[0].userName, userId: result[0].userId, roleName: result[0].roleName, staffViewFlag: staffViewFlag, visitEntryFlag: visitEntryFlag, petrolAllowanceFlag: petrolAllowanceFlag,
                        permissionFlag: permissionFlag, staffId: result[0].staffId
                    }, { expiresIn: '1d' })
                    const returnRes = [
                        {
                            branchId: result[0].branchId,
                            userId: result[0].userId,
                            staffId: result[0].staffId,
                            staffCode: result[0].staffCode,
                            staffProfile: result[0].staffProfile,
                            staffName: result[0].staffName,
                            staffViewFlag: staffViewFlag,
                            permissionFlag: permissionFlag,
                            roleId: result[0].roleId,
                            roleName: result[0].roleName,
                            petrolAllowanceFlag: petrolAllowanceFlag,
                            visitEntryFlag: visitEntryFlag,
                            pagePermission: pagesData,
                            token: token
                        }
                    ]
                    return returnRes;
                } else {
                    throw new Error(messages.INCORRECT_PASSWORD);
                }
            }
            else {
                throw new Error("This time you can't log in. You can log in only between 6 AM to 7 PM IST.");
            }
        } else {
            throw new Error(messages.INVALID_USER);
        }
    } catch (error) {
        throw new Error(error);
    }
}


async function getUserLogin(query) {
    try {
        let iql = "";
        let count = 0;
        if (query && Object.keys(query).length) {
            iql += `WHERE`;
            if (query.userName) {
                iql += count >= 1 ? ` AND` : ``;
                count++;
                iql += ` u.user_name = '${query.userName}'`;
            }
            if (query.isActive) {
                iql += count >= 1 ? ` AND` : ``;
                count++;
                iql += ` u.is_active = ${query.isActive}`;
            }
        }
        const result = await sequelize.query(`SELECT a.applicant_id "applicantId", a.applicant_code "applicantCode",
            CONCAT(a.first_name,' ',a.last_name) as userName,a.contact_no "contactNo",
            a.user_id "userId",u.password "password"
            FROM applicants a
            left join users u on u.user_id = a.user_id  ${iql}`, {
            type: QueryTypes.SELECT,
            raw: true,
            nest: false
        });
        if (result.length > 0) {
            const decrptPasswordData = await decrptPassword(result[0].password)
            if (decrptPasswordData === query.password) {
                return result;
            } else {
                throw new Error(messages.INCORRECT_PASSWORD);
            }
        } else {
            throw new Error(messages.INVALID_USER);
        }

    } catch (error) {
        throw new Error(error);
    }
}

module.exports = {
    getEmployeeLogin,
    getUserLogin
};