'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('status_lists', [
      //-----Gender------//
      {
        status_category_id: 1,
        status_name: "Male"
      },
      {
        status_category_id: 1,
        status_name: "Female"
      },
      {
        status_category_id: 1,
        status_name: "Others"
        // -----Ends----------//
        //-----Activity------//
      },
      {
        status_category_id: 2,
        status_name: "Site Visit"
      },
      //----- Ends------//
      //-----Mode Of Payment Starts------//
      {
        status_category_id: 3,
        status_name: "Cash"
      },
      {
        status_category_id: 3,
        status_name: "Neft"
      },
      //-----Ends------//
      //-----Marital Status------//
      {
        status_category_id: 4,
        status_name: "Single"
      },
      {
        status_category_id: 4,
        status_name: "Married"
      },
      //-----Ends------//
      //-----Language Starts------//
      {
        status_category_id: 5,
        status_name: "Tamil"
      },
      {
        status_category_id: 5,
        status_name: "English"
      },
      {
        status_category_id: 5,
        status_name: "Hindi"
      },
      //-----Ends------//
      //-----Qualification ------//
      {
        status_category_id: 6,
        status_name: "Bsc"
      },
      {
        status_category_id: 6,
        status_name: "Msc"
      },
      {
        status_category_id: 6,
        status_name: "BE"
      },
      {
        status_category_id: 6,
        status_name: "ME"
      },
      {
        status_category_id: 6,
        status_name: "BA"
      },
      {
        status_category_id: 6,
        status_name: "MA"
      },
      //-----Ends------//
      //-----Attendance Status------//
      {
        status_category_id: 7,
        status_name: "Present"
      },
      {
        status_category_id: 7,
        status_name: "Absent"
      },
      {
        status_category_id: 7,
        status_name: "Leave"
      },
      //-----Ends------//
      //-----Caste Ends------//
      {
        status_category_id: 8,
        status_name: "OC"
      },
      {
        status_category_id: 8,
        status_name: "BC"
      },
      {
        status_category_id: 8,
        status_name: "MBC"
      },
      {
        status_category_id: 8,
        status_name: "SC"
      },
      {
        status_category_id: 8,
        status_name: "ST"
      },
      //-----Ends------//
      //-----Start Leave Type------//
      {
        status_category_id: 9,
        status_name: "Casual Leave"
      },
      {
        status_category_id: 9,
        status_name: "Sick Leave"
      },
      //-----Ends------//
      //-----Claim Status------//
      {
        status_category_id: 10,
        status_name: "Requested"
      },
      {
        status_category_id: 10,
        status_name: "Approved"
      },
      {
        status_category_id: 10,
        status_name: "Cancelled"
      },
      //-----Ends------//
      //-----Relation------//
      {
        status_category_id: 11,
        status_name: "Father"
      },
      {
        status_category_id: 11,
        status_name: "Mother"
      },
      {
        status_category_id: 11,
        status_name: "Husband"
      },
      {
        status_category_id: 11,
        status_name: "Wife"
      },
      {
        status_category_id: 11,
        status_name: "Son"
      },
      {
        status_category_id: 11,
        status_name: "Daughter"
      },
      //-----Ends------//
      {
        status_category_id: 12,
        status_name: "1hr"
      },
      {
        status_category_id: 12,
        status_name: "2hr"
      },
      {
        status_category_id: 12,
        status_name: "Half-Day"
      },
      //-----Ends------//
      {
        status_category_id: 13,
        status_name: "Mr"
      },
      {
        status_category_id: 13,
        status_name: "Ms."
      },
      {
        status_category_id: 13,
        status_name: "Mrs."
      },
      //-----Ends------//
      {
        status_category_id: 14,
        status_name: "Immediately"
      },
      {
        status_category_id: 14,
        status_name: "< 15days"
      },
      {
        status_category_id: 14,
        status_name: "1 Month"
      },
      {
        status_category_id: 14,
        status_name: "2 Months"
      },
      {
        status_category_id: 14,
        status_name: "3 Months"
      },
      //-----Ends------//
      {
        status_category_id: 15,
        status_name: "School"
      },
      {
        status_category_id: 15,
        status_name: "College"
      },
      {
        status_category_id: 15,
        status_name: "University"
      },
      {
        status_category_id: 15,
        status_name: "Professional"
      },
      //-----Ends------//
      {
        status_category_id: 16,
        status_name: "Award/Certificate/Scholarship Won"
      },
      {
        status_category_id: 16,
        status_name: "Proficiency in Games/Sports"
      },
      {
        status_category_id: 16,
        status_name: "Proficiency in literary work / art / culture"
      },
      {
        status_category_id: 10,
        status_name: "Disbursed"
      },
      //-----Ends------//
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
