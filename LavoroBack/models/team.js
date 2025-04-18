const mongo = require('mongoose');
const Schema = mongo.Schema;

const Team = new Schema({
    name: { type: String, required: true },
    manager_id: { type: mongoose.Schema.Types.UUID, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    status: { type: String, enum: ['Active', 'Archived'], default: 'Active' }

});
module.exports = mongo.model('team', Team);
