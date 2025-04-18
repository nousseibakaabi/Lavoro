
const mongo = require('mongoose');
const Schema = mongo.Schema;

const Meeting = new Schema(
    {

        organizer_id: { type: mongoose.Schema.Types.UUID, required: true },
        title: { type: String, required: true },
        description: { type: String },
        start_time: { type: Date, required: true },
        end_time: { type: Date, required: true },
        participants: [{ type: mongoose.Schema.Types.UUID }],
        created_at: { type: Date, default: Date.now }

    });
module.exports = mongo.model('meeting', Meeting);
    