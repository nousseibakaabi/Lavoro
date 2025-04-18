const mongo = require('mongoose');
const Schema = mongo.Schema;

const FileSharing = new Schema(
    {
        owner_id: { type: mongoose.Schema.Types.UUID, required: true },
        file_name: { type: String, required: true },
        file_url: { type: String, required: true }, // Stocke l'URL du fichier
        shared_with: [{ type: mongoose.Schema.Types.UUID }], // Liste des utilisateurs avec qui le fichier est partagé
        uploaded_at: { type: Date, default: Date.now }
    }
)
module.exports = mongo.model('fileSharing', FileSharing);
