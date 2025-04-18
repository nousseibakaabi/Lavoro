const mongo = require('mongoose');
const Schema = mongo.Schema;

const Chat = new Schema(
    {
        sender_id: { type: mongoose.Schema.Types.UUID, required: true },
        receiver_id: { type: mongoose.Schema.Types.UUID, required: true },
        message: { type: String, required: true }, 
        sent_at: { type: Date, default: Date.now },
        is_read: { type: Boolean, default: false }

    });
module.exports = mongo.model('chat', Chat);
