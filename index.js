'use strict';
// var path = require('path'),
// 	passport = require('passport');

module.exports = function (periodic) {
	// express,app,logger,config/settings,db
	var adminRouter = periodic.express.Router(),
		periodicRouter = periodic.express.Router(),
		authController = require('../periodicjs.ext.login/controller/auth')(periodic),
		userroleController = require('./controller/userrole')(periodic),
		uacController = require('./controller/uac')(periodic);

	adminRouter.all('*', authController.ensureAuthenticated, uacController.loadUserRoles, uacController.check_user_access);

	//user roles
	adminRouter.get('/userroles', uacController.loadUserAccesControls, userroleController.index);
	adminRouter.get('/userrole/new', userroleController.userrole_new);
	adminRouter.get('/userrole/:id', uacController.loadUserrole, userroleController.show);
	adminRouter.get('/userrole/edit/:id', uacController.loadUserrole, userroleController.show);
	adminRouter.post('/userrole/new', userroleController.create);
	adminRouter.post('/userrole/edit', userroleController.update);
	adminRouter.post('/userrole/:id/delete', uacController.loadUserrole, userroleController.remove);
	periodicRouter.get('/userroles/search.:ext', uacController.loadUserroles, uacController.userroleSearchResults);
	periodicRouter.get('/userroles/search', uacController.loadUserroles, uacController.userroleSearchResults);


	//user priviliges
	periodicRouter.get('/userprivileges/search.:ext', uacController.loadUserprivileges, uacController.userprivilegeSearchResults);
	periodicRouter.get('/userprivileges/search', uacController.loadUserprivileges, uacController.userprivilegeSearchResults);

	//add routes
	periodic.app.use('/p-admin', adminRouter);
	periodic.app.use(periodicRouter);
};
