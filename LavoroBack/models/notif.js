
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const Notif = new Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        notification_text: { type: String, required: true },
        type: { type: String, required: true },
        is_read: { type: Boolean, default: false },
        created_at: { type: Date, default: Date.now },
        read_at: { type: Date },
        updated_at: { type: Date, default: Date.now },
    }
);

module.exports = mongoose.model('notif', Notif); 