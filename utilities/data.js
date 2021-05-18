'use strict';
const periodic = require('periodicjs');
const path = require('path');
const CoreControllerModule = require('periodicjs.core.controller');

function getDataCoreController() {
  try {
    const dataCoreControllers = new Map();
    for (let [dataName, datum, ] of periodic.datas) {
      // const override = (dataName === 'standard_asset') ? {
      //     create: periodic.core.files.uploadMiddlewareHandler({
      //       periodic,
      //     }),
      //     remove: periodic.core.files.removeMiddlewareHandler({ periodic, }),
      //   } :
      //   false;
      // console.log({dataName,override})
      if (dataName === 'standard_user' || dataName === 'standard_account' || dataName === 'standard_userrole' || dataName === 'standard_userprivilege') {
        const CoreController = new CoreControllerModule(periodic, {
          compatibility: false,
          skip_responder: true,
          skip_db: true,
          skip_protocol: true,
        });
        CoreController.initialize_responder({
          adapter: 'json',
        });
        CoreController.initialize_protocol({
          adapter: 'http',
          api: 'rest',
        });
        CoreController.db[dataName] = datum;
        dataCoreControllers.set(dataName, {
          controller: CoreController,
          router: CoreController.protocol.api.implement({
            model_name: dataName,
            // override,
            dirname: path.join(periodic.config.app_root, '/node_modules/@digifi/periodicjs.ext.user_access_control/views'),
          }).router,
        });
      }
    }
    return (dataCoreControllers);
  } catch (e) {
    periodic.logger.error(e);
  }
}

module.exports = {
  getDataCoreController,
};