'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class client_visit extends Model {
    static associate(models) {
      client_visit.belongsTo(models.branch_location_entry_log, {
        foreignKey: 'entry_log_id', as: 'entryLog'
      });
      client_visit.belongsTo(models.staff, {
        foreignKey: 'staff_id', as: 'staff'
      });
    }
  }
  client_visit.init({
    client_visit_id:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    entry_log_id:      { type: DataTypes.INTEGER, allowNull: false },
    staff_id:          { type: DataTypes.INTEGER, allowNull: true },
    visit_sequence:    { type: DataTypes.INTEGER, defaultValue: 1 },
    client_name:       { type: DataTypes.STRING, allowNull: false },
    client_code:       { type: DataTypes.STRING },
    contact_person:    { type: DataTypes.STRING },
    contact_no:        { type: DataTypes.STRING },
    visit_category:    { type: DataTypes.STRING, allowNull: false },
    reached_time:      { type: DataTypes.DATE, allowNull: false },
    reached_latitude:  { type: DataTypes.DECIMAL(11, 7) },
    reached_longitude: { type: DataTypes.DECIMAL(11, 7) },
    departed_at:       { type: DataTypes.DATE, allowNull: true },
    form_data:         { type: DataTypes.JSON },
    photo_url:         { type: DataTypes.STRING },
    status:            { type: DataTypes.STRING, defaultValue: 'pending' },
  }, {
    sequelize,
    modelName: 'client_visit',
    tableName: 'client_visits',
    timestamps: true
  });
  return client_visit;
};
