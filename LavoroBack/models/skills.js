const mongo = require('mongoose');
const Schema = mongo.Schema;
const Skills = new Schema({
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
    },
      
      {
        timestamps: false, // Désactiver createdAt et updatedAt auto
      }
);
module.exports = mongo.model('skills', Skills);
