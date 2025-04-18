const mongo = require('mongoose');
const Schema = mongo.Schema;
const Skills = new Schema({
    
    user_id: { type: mongoose.Schema.Types.UUID, required: true },
    skill_id: { type: mongoose.Schema.Types.UUID, required: true },
    updated_at: { type: Date, default: Date.now }

});
module.exports = mongo.model('user', User);
