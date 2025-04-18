// const mongo = require('mongoose');
// const Schema = mongo.Schema;

// const Project = new Schema({
//     name: { type: String, required: true , index: true },// index pour optimiser les recherches,
//     description: { type: String },
//     budget: { type: Number, default: 0 },
//     manager_id: { type: mongo.Schema.Types.ObjectId, ref: 'user' }, // Reference to User model
//     ProjectManager_id: { type: mongo.Schema.Types.ObjectId, ref: 'user' }, // Reference to User model
//     team_id: { type: mongo.Schema.Types.ObjectId },
//     client: { type: String },
//     start_date: { type: Date },
//     end_date: { type: Date },
//     status: { 
//         type: String, 
//         enum: ['Not Started', 'In Progress', 'Completed', 'Archived'], 
//         default: 'Not Started' 
//     },
//     risk_level: {
//         type: String,
//         enum: ['Low', 'Medium', 'High'],
//         default: 'Medium', 
//     },
//     risks: { type: String, default: 'None' }, 
//     tags: { type: String },
//     ai_predicted_completion: { type: Date },
//     ai_predicted_description: { type: String },
//     created_at: { type: Date, default: Date.now },
//     updated_at: { type: Date, default: Date.now }
// });
// // Crée un index texte si vous voulez des recherches full-text
// Project.index({ name: 'text' });
// module.exports = mongo.model('Project', Project);


// /*
// const mongo = require('mongoose');
// const Schema = mongo.Schema;

// const Project = new Schema({
//   project_id: { type: String, required: true, unique: true }, // Unique identifier
//   project_name: { type: String, required: true }, // Project name
//   description: { type: String }, // Project description
//   budget: { type: Number, default: 0 }, // AI can predict this
//   manager_id: { type: mongo.Schema.Types.UUID, required: true }, // Manager ID
//   team_id: { type: mongo.Schema.Types.UUID, required: true }, // Team ID
//   start_date: { type: Date }, // AI can predict this
//   end_date: { type: Date }, // AI can predict this
//   status: {
//     type: String,
//     enum: ['Not Started', 'In Progress', 'Completed', 'Archived'],
//     default: 'Not Started',
//   },
//   priority: { type: String }, // Priority level (e.g., Low, Medium, High)
//   completed_tasks_count: { type: Number, default: 0 }, // Completed tasks count
//   total_tasks_count: { type: Number, default: 0 }, // AI can predict this
//   estimated_duration: { type: Number, default: 0 }, // AI can predict this
//   actual_duration: { type: Number, default: 0 }, // Actual duration
//   performance_score: { type: Number, default: 0 }, // Performance score
//   risk_level: {
//     type: String,
//     enum: ['Low', 'Medium', 'High'],
//     default: 'Medium', // AI can predict this
//   },
//   tasks_in_progress_count: { type: Number, default: 0 }, // Tasks in progress
//   tasks_not_started_count: { type: Number, default: 0 }, // Tasks not started
//   //project_history_changes: { type: Schema.Types.Mixed }, // History of changes
//   team_member_count: { type: Number, default: 0 }, // AI can predict this
//   ai_predicted_completion: { type: Date }, // AI-predicted completion date
//   ai_predicted_description: { type: String }, // AI-generated detailed description
//   ai_generated: { type: Boolean, default: false }, // Flag to indicate if AI generated the data
//   created_at: { type: Date, default: Date.now },
//   updated_at: { type: Date, default: Date.now },
// });

// module.exports = mongo.model('project', Project);
// */



const mongo = require('mongoose');
const Schema = mongo.Schema;

const Project = new Schema({
    name: { type: String, required: true , index: true },// index pour optimiser les recherches,
    description: { type: String },
    budget: { type: Number, default: 0 },
    manager_id: { type: mongo.Schema.Types.ObjectId, ref: 'user' }, // Reference to User model
    ProjectManager_id: { type: mongo.Schema.Types.ObjectId, ref: 'user' }, // Reference to User model

    team_id: { type: mongo.Schema.Types.ObjectId },
    client: { type: String },
    start_date: { type: Date },
    end_date: { type: Date },
    total_tasks_count: { type: Number, default: 0 }, 
    estimated_duration: { type: Number, default: 0 }, 
    team_member_count: { type: Number, default: 0 }, 
    priority: { type: String }, 
    status: { 
        type: String, 
        enum: ['Not Started', 'In Progress', 'Completed', 'Archived'], 
        default: 'Not Started' 
    },
    risk_level: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium', 
    },
    risks: { type: String, default: 'None' }, 
    tags: { type: String },
    ai_predicted_completion: { type: Date },
    ai_predicted_description: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
// Crée un index texte si vous voulez des recherches full-text
Project.index({ name: 'text' });
module.exports = mongo.model('Project', Project);


