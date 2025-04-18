const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TaskHistory = new Schema({
    task_id: { type: mongoose.Schema.Types.UUID, required: true },
    changed_by: { type: mongoose.Schema.Types.UUID, required: true },
    change_type: { 
        type: String, 
        enum: ['Status Update', 'Priority Change', 'Assignment Change'], 
        required: true 
    },
    old_value: { type: String, required: true },
    new_value: { type: String, required: true },
    changed_at: { type: Date, default: Date.now }
});
module.exports = mongoose.model('taskHistory', TaskHistory);
