const mongo = require('mongoose');
const Schema = mongo.Schema;

const TeamMember = new Schema({

    team_id: { type: mongoose.Schema.Types.UUID, required: true },
    user_id: { type: mongoose.Schema.Types.UUID, required: true },
    role: { type: String, enum: ['Developer', 'Tester', 'Analyst', 'Designer'], required: true },
    skills: [{ type: mongoose.Schema.Types.UUID }],
    performance_score: { type: Number, default: 0 },
    completed_tasks_count: { type: Number, default: 0 },
    joined_at: { type: Date, default: Date.now }
    
    });
    module.exports = mongo.model('teamMember', TeamMember);