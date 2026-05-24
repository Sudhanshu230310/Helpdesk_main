const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const {
    getDashboardStats,
    reportByCategory, reportBySubcategory, reportByTechnician, getTicketTurnaround,
    getAllUsers,
    getTeams, createTeam, addTeamMember,
    getCategories, createCategory, createSubcategory,
    getHolidays, createHoliday, deleteHoliday,
    createUser, bulkCreateUsers, deleteUser,
    getSettings, updateSettings, generatePdfReport,
} = require('../controllers/adminController');

// Multer setup for CSV uploads (in-memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed.'), false);
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// All admin routes require authentication
router.use(authenticate);

// Dashboard — all authenticated users can see their stats
router.get('/dashboard', getDashboardStats);

// Reports — admin & technician & team_lead
router.get('/reports/by-category', authorize('admin', 'technician', 'team_lead'), reportByCategory);
router.get('/reports/by-subcategory', authorize('admin', 'technician', 'team_lead'), reportBySubcategory);
router.get('/reports/by-technician', authorize('admin'), reportByTechnician);
router.get('/reports/turnaround/:ticketId', authorize('admin', 'technician', 'team_lead'), getTicketTurnaround);
router.get('/reports/pdf', authorize('admin', 'technician', 'team_lead'), generatePdfReport);

// System Settings
router.get('/settings', authorize('admin'), getSettings);
router.post('/settings', authorize('admin'), updateSettings);

// User management — admin only
router.get('/users', authorize('admin'), getAllUsers);
router.post('/users', authorize('admin'), createUser);
router.delete('/users/:id', authorize('admin'), deleteUser);
router.post('/users/bulk', authorize('admin'), upload.single('csvFile'), bulkCreateUsers);

// Team management — admin only
router.get('/teams', authorize('admin', 'technician', 'team_lead'), getTeams);
router.post('/teams', authorize('admin'), createTeam);
router.post('/teams/:id/members', authorize('admin'), addTeamMember);

// Category management — admin only
router.get('/categories', authorize('admin', 'technician', 'team_lead'), getCategories);
router.post('/categories', authorize('admin'), createCategory);
router.post('/subcategories', authorize('admin'), createSubcategory);

// Holidays
router.get('/holidays', getHolidays);
router.post('/holidays', authorize('admin'), createHoliday);
router.delete('/holidays/:id', authorize('admin'), deleteHoliday);

module.exports = router;
