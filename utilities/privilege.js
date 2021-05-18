'use strict';
const periodic = require('periodicjs');
const passportUtilities = periodic.locals.extensions.get('@digifi/periodicjs.ext.passport');
const httpMethods = ['get', 'put', 'post', 'delete'];

function getPrivilegeCheckTransform(options) {
  const { entitytype, privileges } = options;
  return function permissionTransform(req) {
    return new Promise((resolve, reject) => {
      try {
        if (checkPrivileges({ req, entitytype, privileges })) {
          resolve(req);
        }
      } catch (e) {
        reject(e);
      }
    });
  };
}

const getPrivilegeTransformReducer = (uacSettings, transformType, httpMethod) => (result, key) => {
  const options = uacSettings.prilivege_transforms[transformType][httpMethod][key];
  result[key] = getPrivilegeCheckTransform(options);
  return result;
};

const httpMethodTransformReducer = (uacSettings, transformType) => (result, httpMethod) => {
  result[httpMethod.toUpperCase()] = Object.keys(uacSettings.prilivege_transforms[transformType][httpMethod]).reduce(getPrivilegeTransformReducer(uacSettings, transformType, httpMethod), {});
  return result;
};

function getPrivilegeTransforms() {
  const uacSettings = periodic.settings.extensions['@digifi/periodicjs.ext.user_access_control'];
  const transforms = {
    pre: httpMethods.reduce(httpMethodTransformReducer(uacSettings, 'pre'), {}),
    post: httpMethods.reduce(httpMethodTransformReducer(uacSettings, 'post'), {}),
  }
  return transforms;
}

function checkPrivileges(options) {
  const { req, entitytype, privileges } = options;
  const uacSettings = periodic.settings.extensions['@digifi/periodicjs.ext.user_access_control'];
  let entityTypeCheck = (entitytype && entitytype[req.user.entitytype]) ?
    true :
    entitytype[Object.keys(entitytype)[0]];
  let privilegeChecks = [];
  if (uacSettings.allow_admin_overrides && req.user.accounttype === uacSettings.admin_override_accounttype) {
    privilegeChecks = [];
  } else if (privileges) {
    if (Array.isArray(req.user.privileges) === false || req.user.privileges.length < 1) {
      privilegeChecks.push(privileges[Object.keys(privileges)[0]]);
    } else {
      const missingPrivileges = Object.keys(privileges).filter(privilege => req.user.privileges.indexOf(parseInt(privilege.replace('_', '')), 10) === -1) || [];
      privilegeChecks.push(...missingPrivileges);
    }
  }

  if (entityTypeCheck !== true) {
    throw new Error(entityTypeCheck);
  }
  if (privilegeChecks.length) {
    throw new Error(privilegeChecks[0]);
  }
  return true;
}

function hasPrivilege(user, privilege) {
  // console.log(' hasPrivilege user, privilege',user,privilege);
  return user.accounttype === 'admin' || user.privileges[privilege];
};

function stageUserRoles(populated) {
  return new Promise((resolve, reject) => {
    try {
      let privileges = {};
      for (let i = 0; i < populated.userroles.length; i++) {
        let roles = populated.userroles[i];
        for (let x = 0; x < roles.privileges.length; x++) {
          privileges[roles.privileges[x].userprivilegeid] = roles.privileges[x];
        }
      }
      // console.log({ privileges });
      return privileges;
    } catch (e) {
      reject(e);
    }
  });
};

function getPrivilegesFromRoles(options) {
  return new Promise((resolve, reject) => {
    try {
      const { req, user } = options;
      user.userroles = user.userroles || [];
      const privilegeIds = user.userroles.reduce((result, userRole) => {
        if (userRole.privileges && userRole.privileges.length) {
          result.push(...userRole.privileges);
        }
        return result;
      }, []);
      const PrivilegesCoreData = periodic.datas.get('standard_userprivilege');
      PrivilegesCoreData.query({
          query: {
            _id: {
              $in: privilegeIds,
            }
          }
        })
        .then(privilegeData => resolve(privilegeData.map(priv => priv.userprivilegeid)))
        .catch(reject);
      // console.log({ privilegeIds });
    } catch (e) {
      reject(e);
    }
  })
}

function setUserSessionFromSessionPrivileges(options) {
  const { req, next } = options;
  req.user.privileges = req.session.userprivilegesdata;
  req.controllerData.userprivileges = req.session.userprivilegesdata;
  next();
}

function setPrivilegesOnUser(options) {
  const { req, next, privileges } = options;
  req.user.privileges = privileges;
  req.session.userprivilegesdata = privileges;
  req.controllerData.userprivileges = privileges;
  next();
}

module.exports = {
  getPrivilegeCheckTransform,
  getPrivilegeTransformReducer,
  httpMethodTransformReducer,
  getPrivilegeTransforms,
  checkPrivileges,
  hasPrivilege,
  stageUserRoles,
  getPrivilegesFromRoles,
  setUserSessionFromSessionPrivileges,
  setPrivilegesOnUser,
};