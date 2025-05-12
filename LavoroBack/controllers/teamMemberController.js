
const TeamMember = require('../models/teamMember');
const User = require('../models/user');
const Skills = require('../models/skills');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Team = require('../models/team');
const Project = require('../models/Project');


exports.getTeamMemberById = async (req, res) => {
  try {
    const { id } = req.params; // Maintenant on utilise l'ID direct du User

    // Recherche le TeamMember par l'ID du User
    const teamMember = await TeamMember.findOne({ user_id: id })
      .populate('user_id')
      .populate('skills');

    if (!teamMember) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team member not found for this user ID' 
      });
    }

    // Construction de la réponse
    const responseData = {
      id: teamMember._id,
      teamId: teamMember.team_id,
      name: teamMember.user_id 
        ? `${teamMember.user_id.firstName || ''} ${teamMember.user_id.lastName || ''}`.trim()
        : 'Unknown',
      role: teamMember.role,
      email: teamMember.user_id?.email || '',
      image: teamMember.user_id?.image || '',
      phone: teamMember.user_id?.phone_number || '',
      skills: teamMember.skills?.map(skill => ({
        id: skill._id,
        name: skill.name || 'Unnamed Skill',
        description: skill.description || ''
      })) || [],
      performance_score: teamMember.performance_score,
      completed_tasks_count: teamMember.completed_tasks_count,
      joined_at: teamMember.joined_at
    };

    res.status(200).json({ success: true, data: responseData });

  } catch (error) {
    console.error('Error fetching team member by user ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching team member',
      error: error.message 
    });
  }
};

exports.getTeamMembersByTeamId = async (req, res) => {
  try {
    const { teamId } = req.params;

    //   Récupère les membres de l'équipe avec les infos utilisateur et compétences
    const members = await TeamMember.find({ team_id: teamId })
      .populate('user_id', 'firstName lastName image')
      .populate('skills', 'name');

      if (!members) {
        return res.status(404).json({ success: false, message: 'Team members not found' });
      }

    // Formate la réponse
    const result = members.map(member => ({
      id: member._id,
      name: member.user_id ? `${member.user_id.firstName} ${member.user_id.lastName}` : 'Membre inconnu',
      image: member.user_id?.image || '',
      role: member.role,
      skills: member.skills?.map(s => s.name) || [],
      performance: member.performance_score,
      tasksCompleted: member.completed_tasks_count
    }));

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des membres'
    });
  }
};


exports.addTeamMember = async (req, res) => {
  try {
      const { team_id, user_id, skills } = req.body;

      // Validation des données requises
      if (!team_id || !user_id || !skills || !Array.isArray(skills)) {
          return res.status(400).json({
              success: false,
              message: 'team_id, user_id et skills (tableau) sont requis'
          });
      }

      // Vérification si le membre existe déjà dans l'équipe
      const existingMember = await TeamMember.findOne({ 
          team_id: team_id, 
          user_id: user_id 
      });

      if (existingMember) {
          return res.status(409).json({
              success: false,
              message: 'Cet utilisateur est déjà membre de cette équipe'
          });
      }

      // Récupération des informations de l'utilisateur, équipe et projet
      const [user, team, project] = await Promise.all([
          User.findById(user_id),
          Team.findById(team_id),
          Project.findOne({ manager_id: team_id }) // Supposons que vous avez un modèle Project
      ]);

      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'Utilisateur non trouvé'
          });
      }

      // Création du nouveau membre d'équipe
      const newTeamMember = new TeamMember({
          team_id: team_id,
          user_id: user_id,
          role : user.role._id,
          skills: skills,
          performance_score: 0,
          completed_tasks_count: 0
      });

      // Sauvegarde dans la base de données
      const savedMember = await newTeamMember.save();

      // Configuration du transporteur email
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
          }
      });

      // URL de connexion (à adapter selon votre frontend)
      const loginUrl = `localhost:4200/signin`;
      
      // Options de l'email avec template amélioré
      const mailOptions = {
          from: `"Gestion d'Équipe" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: `Invitation à l'équipe ${team?.name || ''}`,
          html: `
          <div style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #fff; max-width: 600px; margin: auto; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <h1 style="color: #ff33cc; text-shadow: 0 0 10px #ff33cc;">🚀 Bienvenue dans l'équipe !</h1>
            </div>

            <div style="padding: 20px;">
              <p>Bonjour <strong>${user.name || 'Cher collaborateur'}</strong>,</p>
              <p>Vous avez été ajouté à :</p>
              <ul style="list-style-type: none; padding: 0;">
                <li><strong>👥 Équipe :</strong> ${team?.name || 'Nouvelle équipe'}</li>
                <li><strong>📁 Projet :</strong> ${project?.name || 'Nouveau projet'}</li>
                <li><strong>🎯 Rôle :</strong> Developer</li>
                <li><strong>🧠 Compétences :</strong> ${skills.join(', ')}</li>
              </ul>

              <p style="margin-top: 30px;">Cliquez ci-dessous pour accéder à votre espace :</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/ProjectDash"
                  style="background: linear-gradient(90deg, #ff33cc, #cc00ff); 
                          color: white; padding: 15px 30px; 
                          border-radius: 30px; font-weight: bold; 
                          text-decoration: none; font-size: 16px;
                          box-shadow: 0 0 15px #ff33cc, 0 0 30px #cc00ff;">
                  🎉 Accéder à mon espace
                </a>
              </div>

              <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
              <p style="color: #ff33cc; word-break: break-all;">http://localhost:4200/dashboard</p>
            </div>

            <div style="background-color: #1a1a1a; padding: 15px; text-align: center; font-size: 12px; color: #aaa;">
              <p>© ${new Date().getFullYear()} Votre Société. Tous droits réservés.</p>
            </div>
          </div>
          `
      };

      // Affichage des détails avant envoi
      console.log('====================================');
      console.log('Envoi d\'email à:', user.email);
      console.log('Sujet:', mailOptions.subject);
      console.log('URL de connexion:', loginUrl);
      console.log('====================================');

      // Envoi de l'email
      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.error('Échec de l\'envoi:', error);
          } else {
              console.log('Email envoyé avec succès. ID:', info.messageId);
          }
      });

      res.status(201).json({
          success: true,
          message: 'Membre ajouté avec succès',
          data: savedMember,
          emailSentTo: user.email
      });

  } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({
          success: false,
          message: 'Erreur serveur',
          error: error.message
      });
  }
};








// In your backend controller
exports.getAllMemberTask = async (req, res) => {
  try {
    const members = await TeamMember.find({})
      .populate('user_id', 'firstName lastName image')
      .lean();
    
    // Filter out any invalid members
    const validMembers = members.filter(member => member?._id);
    
    res.status(200).json({
      success: true,
      data: validMembers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching team members'
    });
  }
};



exports.getAllMembers = async (req, res) => {
  try {
    const members = await TeamMember.find()
      .populate('user_id', 'firstName lastName image')
      .populate('skills', 'name');

    if (!members) {
      return res.status(404).json({ success: false, message: 'No team members found' });
    }

    const result = members.map(member => ({
      id: member._id,
      name: member.user_id ? `${member.user_id.firstName} ${member.user_id.lastName}` : 'Unknown',
      image: member.user_id?.image || '',
      role: member.role,
      skills: member.skills?.map(s => s.name) || [],
      performance: member.performance_score,
      tasksCompleted: member.completed_tasks_count
    }));

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team members'
    });
  }
};


exports.getAll = async (req, res) => {
  try {
      // Récupérer tous les membres d'équipe avec les informations utilisateur associées
      const members = await TeamMember.find()
          .populate({
              path: 'user_id',
              select: 'name email image firstName lastName', // Sélectionnez les champs que vous voulez de l'utilisateur
              model: User
          })
          .populate('skills');

      // Formater la réponse pour inclure l'image et autres détails
      const formattedMembers = members.map(member => ({
          _id: member._id,
          team_id: member.team_id,
          user: {
              _id: member.user_id._id,
              firstName: member.user_id.firstName,
              lastName: member.user_id.lastName,
              image: member.user_id.image // URL de l'image du membre
          },
          role: member.role,
          skills: member.skills,
          performance_score: member.performance_score,
          completed_tasks_count: member.completed_tasks_count
      }));

      res.status(200).json({
          success: true,
          data: formattedMembers
      });
  } catch (error) {
      console.error("Erreur lors de la récupération des membres:", error);
      res.status(500).json({
          success: false,
          message: "Erreur serveur lors de la récupération des membres"
      });
  }
};


// exports.getTeamMemberById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const teamMember = await TeamMember.findById(id)
//       .populate('user_id')
//       .populate('skills');

//     if (!teamMember) {
//       return res.status(404).json({ success: false, message: 'Team member not found' });
//     }

//     // Construction de la réponse
//     const responseData = {
//       id: teamMember._id,
//       teamId: teamMember.team_id,
//       name: teamMember.user_id 
//         ? `${teamMember.user_id.firstName || ''} ${teamMember.user_id.lastName || ''}`.trim()
//         : 'Unknown',
//       role: teamMember.role,
//       email: teamMember.user_id?.email || '',
//       image: teamMember.user_id?.image || '',
//       phone: teamMember.user_id?.phone_number || '',
//       skills: teamMember.skills?.map(skill => ({
//         id: skill._id,
//         name: skill.name || 'Unnamed Skill',
//         description: skill.description || ''
//       })) || [],
//       performance_score: teamMember.performance_score,
//       completed_tasks_count: teamMember.completed_tasks_count,
//       joined_at: teamMember.joined_at
//     };

//     res.status(200).json({ success: true, data: responseData });

//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error',
//       error: error.message 
//     });
//   }
// };

