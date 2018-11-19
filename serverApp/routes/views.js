var views = require('../controllers/views')
var router = global.express.Router();

router.get('/template/:name',views.templates);
router.get('/includes/:name',views.includes);
router.all("*", views.index);

module.exports = router;
