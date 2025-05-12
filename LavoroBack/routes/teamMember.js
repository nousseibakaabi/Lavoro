const express = require('express');
const router = express.Router();
const teamMemberController = require('../controllers/teamMemberController');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Team = require('../models/team');



const { spawn } = require("child_process");
const teamMember = require("../models/teamMember");
const PredictMember = require("../models/PredictMember"); // Import the PredictMember model
const User = require("../models/user");


router.get('/getAllMembers', teamMemberController.getAllMembers);
router.get('/getAllMemberTasks', teamMemberController.getAllMemberTask);


//Récupérer un membre d'équipe par ID
router.get('/getTeamMember/:id', teamMemberController.getTeamMemberById);
router.get('/getAllTeamMembers/:teamId', teamMemberController.getTeamMembersByTeamId);
router.post('/addTeamMembers', teamMemberController.addTeamMember);

router.get('/getAll', teamMemberController.getAll);


module.exports = router;







