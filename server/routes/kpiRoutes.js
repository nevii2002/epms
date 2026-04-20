const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const { verifyToken, isAdminOrManager } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', kpiController.getAllKPIs);
router.post('/', isAdminOrManager, kpiController.createKPI);
router.put('/:id', isAdminOrManager, kpiController.updateKPI);
router.delete('/:id', isAdminOrManager, kpiController.deleteKPI);

module.exports = router;
