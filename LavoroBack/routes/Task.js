const express = require('express');
const router = express.Router();
const { seedTasks, seedTaskHistory,getTasksByUser } = require('../controllers/TaskController');
const auth = require('../middleware/authenticatedToken');

const taskController = require('../controllers/TaskController')

router.post('/seedtasks', async (req, res) => {
    try {
        await seedTasks();
        res.status(200).json({ message: 'Tasks seeded successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error seeding tasks' });
    }
});

router.post('/seed-task-history', async (req, res) => {
    try {
        await seedTaskHistory();
        res.status(200).json({ message: 'Task history seeded successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error seeding task history' });
    }
});
router.get('/getTasksByUser/:userId', getTasksByUser);
router.get('/my-tasks', auth, taskController.getTasksByUser);
module.exports = router;