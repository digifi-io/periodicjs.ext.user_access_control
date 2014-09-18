'use strict';

var path = require('path'),
    Utilities = require('periodicjs.core.utilities'),
    ControllerHelper = require('periodicjs.core.controllerhelper'),
    CoreUtilities,
    CoreController,
    appSettings,
    mongoose,
    User,
    Userrole,
    Userprivilege,
    Usergroup,
    logger;

var createUACObject = function(req,res,next, reqcontrollerdatauacobject, model, redirectpath){
    if(reqcontrollerdatauacobject){
        CoreController.handleDocumentQueryRender({
            req:req,
            res:res,
            responseData:{
                result:'success',
                data:{
                    doc:reqcontrollerdatauacobject
                }
            }
        });
    }
    else{
        var newuacobject = CoreUtilities.removeEmptyObjectValues(req.body);
        newuacobject.name = CoreUtilities.makeNiceName(newuacobject.title);
        newuacobject.author = req.user._id;

        CoreController.createModel({
            model:model,
            newdoc:newuacobject,
            res:res,
            req:req,
            successredirect:redirectpath,
            appendid:true
        });
    }
};

var createUsergroup = function(req, res, next) {
    var reqcontrollerdataobj = (req.controllerData.usergroup)? req.controllerData.usergroup : null;
    createUACObject(req, res, next, reqcontrollerdataobj, Usergroup, '/p-admin/uac/usergroup/edit/');
};

var createUserrole = function(req, res, next) {
    var reqcontrollerdataobj = (req.controllerData.userrole)? req.controllerData.userrole : null;
    createUACObject(req, res, next, reqcontrollerdataobj, Userrole, '/p-admin/uac/userrole/edit/');
};

var createUserprivilege = function(req, res, next) {
    var reqcontrollerdataobj = (req.controllerData.userprivilege)? req.controllerData.userprivilege : null;
    createUACObject(req, res, next, reqcontrollerdataobj, Userprivilege, '/p-admin/uac/userprivilege/edit/');
};

var loadUacObject = function(req,res,next,population,model,objecttype){
    var params = req.params,
        docid = params.id;
        // console.log("docid",docid);

    req.controllerData = (req.controllerData)?req.controllerData:{};

    CoreController.loadModel({
        docid:docid,
        model:model,
        population:population,
        callback:function(err,doc){
            if(err){
                CoreController.handleDocumentQueryErrorResponse({
                    err:err,
                    res:res,
                    req:req
                });
            }
            else if(!doc){
                CoreController.handleDocumentQueryErrorResponse({
                    err:new Error('invalid request'),
                    res:res,
                    req:req
                });
            }
            else{
                switch(objecttype){
                    case 'usergroup':
                        req.controllerData.usergroup = doc;
                        next();
                        break;
                    case 'userrole':
                        req.controllerData.userrole = doc;
                        next();
                        break;
                    case 'userprivilege':
                        req.controllerData.userprivilege = doc;
                        next();
                        break;
                }
            }
        }
    });
};

var loadUsergroup = function(req,res,next){
    loadUacObject(req, res, next, 'roles', Usergroup, 'usergroup');
};

var loadUserrole = function(req,res,next){
    loadUacObject(req, res, next, 'privileges', Userrole, 'userrole');
};

var loadUserprivilege = function(req,res,next){
    loadUacObject(req, res, next, null, Userprivilege, 'userprivilege');
};

var loadUacObjects = function(req,res,next,population,model,objecttype){
    var query,
        offset = req.query.offset,
        sort = req.query.sort,
        limit = req.query.limit,
        searchRegEx = new RegExp(CoreUtilities.stripTags(req.query.search), 'gi');

    req.controllerData = (req.controllerData)?req.controllerData:{};
    if(req.query.search===undefined || req.query.search.length<1){
        query={};
    }
    else{
        query = {
            $or: [{
                title: searchRegEx,
                }, {
                'name': searchRegEx,
            }]
        };
    }

    CoreController.searchModel({
        model:model,
        query:query,
        sort:sort,
        limit:limit,
        offset:offset,
        population:population,
        callback:function(err,documents){
            if(err){
                CoreController.handleDocumentQueryErrorResponse({
                    err:err,
                    res:res,
                    req:req
                });
            }
            else{
                switch(objecttype){
                    case 'usergroup':
                        req.controllerData.usergroups = documents;
                        next();
                        break;
                    case 'userrole':
                        req.controllerData.userroles = documents;
                        next();
                        break;
                    case 'userprivilege':
                        req.controllerData.userprivileges = documents;
                        next();
                        break;
                }
            }
        }
    });
};

var loadUsergroups = function(req,res,next){
    loadUacObjects(req, res, next, 'roles', Usergroup, 'usergroup');
};

var loadUserroles = function(req,res,next){
    loadUacObjects(req, res, next, 'privileges', Userrole, 'userrole');
};

var loadUserprivileges = function(req,res,next){
    loadUacObjects(req, res, next, null, Userprivilege, 'userprivilege');
};

var searchResults = function(title,data,req,res){
    CoreController.getPluginViewDefaultTemplate(
        {
            viewname:'search/index',
            themefileext:appSettings.templatefileextension
        },
        function(err,templatepath){
            CoreController.handleDocumentQueryRender({
                res:res,
                req:req,
                renderView:templatepath,
                responseData:{
                    pagedata: {
                        title:title
                    },
                    uacdata:data,
                    user: CoreUtilities.removePrivateInfo(req.user)
                }
            });
        }
    );
};

var userroleResults = function(req,res,next){
    searchResults('User Role Search Results',req.controllerData.userroles,req,res,next);
};

var userprivilegeResults = function(req,res,next){
    searchResults('User Privilege Search Results',req.controllerData.userprivileges,req,res,next);
};

var usergroupResults = function(req,res,next){
    searchResults('User Group Search Results',req.controllerData.usergroups,req,res,next);
};

var loadUacUsers = function(req,res,next){
    var query,
        offset = req.query.offset,
        sort = req.query.sort,
        limit = req.query.limit,
        population = 'extensionattributes userasset userroles',
        User = mongoose.model('User'),
        searchRegEx = new RegExp(CoreUtilities.stripTags(req.query.search), 'gi');

    req.controllerData = (req.controllerData)?req.controllerData:{};
    if(req.query.search===undefined || req.query.search.length<1){
        query={};
    }
    else{
        query = {
            $or: [{
                title: searchRegEx,
                }, {
                'name': searchRegEx,
            }]
        };
    }

    CoreController.searchModel({
        model:User,
        query:query,
        sort:sort,
        limit:limit,
        offset:offset,
        population:population,
        callback:function(err,documents){
            if(err){
                CoreController.handleDocumentQueryErrorResponse({
                    err:err,
                    res:res,
                    req:req
                });
            }
            else{
                req.controllerData.users = documents;
                next();
            }
        }
    });
};

var loadUserAccesControls = function(req,res,next){
    var query,
        offset = req.query.offset,
        sort = req.query.sort,
        limit = req.query.limit,
        population = 'privileges',
        searchRegEx = new RegExp(CoreUtilities.stripTags(req.query.search), 'gi');

    req.controllerData = (req.controllerData)?req.controllerData:{};
    if(req.query.search===undefined || req.query.search.length<1){
        query={};
    }
    else{
        query = {
            $or: [{
                title: searchRegEx,
                }, {
                'name': searchRegEx,
            }]
        };
    }

    CoreController.searchModel({
        model:Userrole,
        query:query,
        sort:sort,
        limit:limit,
        offset:offset,
        population:population,
        callback:function(err,documents){
            if(err){
                CoreController.handleDocumentQueryErrorResponse({
                    err:err,
                    res:res,
                    req:req
                });
            }
            else{
                req.controllerData.userroles = documents;
                next();
            }
        }
    });
};

var uacSearchResults = function(req,res,next,objecttype){
    var responseData ={};

    switch(objecttype){
        case 'usergroup':
            responseData = {
                pagedata: {
                    title: 'User Group Results'
                },
                usergroups: req.controllerData.usergroups,
                user: CoreUtilities.removePrivateInfo(req.user)
            };
            break;
        case 'userrole':
            responseData = {
                pagedata: {
                    title: 'User Roles Results'
                },
                userroles: req.controllerData.userroles,
                user: CoreUtilities.removePrivateInfo(req.user)
            };
            break;
        case 'userprivilege':
            responseData = {
                pagedata: {
                    title: 'User Roles Results'
                },
                userprivileges: req.controllerData.userprivileges,
                user: CoreUtilities.removePrivateInfo(req.user)
            };
            break;
    }
    CoreController.getPluginViewDefaultTemplate({
            viewname: 'search/index',
            themefileext: appSettings.templatefileextension
        },
        function (err, templatepath) {
            CoreController.handleDocumentQueryRender({
                res: res,
                req: req,
                renderView: templatepath,
                responseData: responseData
            });
        }
    );
};

var userroleSearchResults = function(req,res,next){
    uacSearchResults(req,res,next,'userrole');
};

var userprivilegeSearchResults = function(req,res,next){
    uacSearchResults(req,res,next,'userprivilege');
};

var usergroupSearchResults = function(req,res,next){
    uacSearchResults(req,res,next,'usergroup');
};

var loadUserRoles = function(req,res,next){
    var requserroles = {};
    req.controllerData = (req.controllerData)?req.controllerData:{};

    if(req.isAuthenticated()){
        if(req.session && req.session.userprivilegesdata /* && true===false */){
            req.user.privileges =  req.session.userprivilegesdata;
            req.controllerData.userprivileges = req.session.userprivilegesdata;
            next();
        }
        else{
            User.populate(req.user,{path:'userroles.privileges',model:'Userprivilege'},function(err,populateduser){
                if(err){
                    next(err);
                }
                else{
                    req.user.privileges = {};
                    for(var i = 0; i < populateduser.userroles.length; i++){
                        requserroles = populateduser.userroles[i];
                        for (var j = 0; j < requserroles.privileges.length; j++){
                            req.user.privileges[requserroles.privileges[j].userprivilegeid] = requserroles.privileges[j];
                        }
                    }
                    req.session.userprivilegesdata = req.user.privileges;
                    req.controllerData.userprivileges = req.session.userprivilegesdata;

                    // req.controllerData.userprivileges = req.user.privileges;
                    // console.log("req.user.privileges",req.user.privileges);
                    next();
                }
            });
        }
    }
    else{
        next(); 
    }
};

var check_user_access = function(req,res,next){
    var httpmethod = req.method,
        httpurl = path.resolve(req.originalUrl.toLowerCase());
        // console.log(req.user.acounttype);
    // console.log(req.method,req.originalUrl);
    // http://stackoverflow.com/questions/6579308/javascript-inoperant-switch-case-with-a-regex
    // var testme = "pwd_foo", response;
    // var reg = /^pwd.+/;
    switch (true) {
        // case testme=='pwd':
        //     response = 'case1';
        //     break;
        // case reg.test(testme):
        //     response = 'case2';
        //     break;
        case httpurl==='/p-admin/items' || httpurl==='/p-admin/collections'  || httpurl==='/p-admin/contenttypes'  || httpurl==='/p-admin/tags'  || httpurl==='/p-admin/categories'   || httpurl==='/p-admin/assets' : 
            if(!User.hasPrivilege(req.user,110)){
                next(new Error('EXT-UAC110: You don\'t have access to view content'));
            }
            else{
                next();
            }
            break;
        case httpurl==='/p-admin/item/new' || httpurl==='/p-admin/collection/new' || httpurl==='/item/new' || httpurl==='/tag/new' || httpurl==='/collection/new' || httpurl==='/category/new' || httpurl==='/contenttype/new': 
            if(!User.hasPrivilege(req.user,110)){
                next(new Error('EXT-UAC110: You don\'t have access to create content'));
            }
            else if(!User.hasPrivilege(req.user,310)){
                next(new Error('EXT-UAC310: You don\'t have access to create content'));
            }
            else{
                next();
            }
            break;
        case httpurl==='/item/new':
            if(httpmethod==='POST' && !User.hasPrivilege(req.user,310)){
                next(new Error('EXT-UAC310: You don\'t have access to publish new content'));
            }
            else{
                next();
            }
            break;
        case (/p-admin\/item/gi.test(httpurl)) : 
            if(httpmethod.toLowerCase()==='post' && !User.hasPrivilege(req.user,710)){
                next(new Error('EXT-UAC710: You don\'t have access to modify content'));
            }
            else if(httpmethod.toLowerCase()==='post' && !User.hasPrivilege(req.user,710)){
                next(new Error('EXT-UAC710: You don\'t have access to delete content'));
            }
            else{
                next();
            }
            break;
        case (/p-admin\/collection/gi.test(httpurl)) : 
            if(httpmethod.toLowerCase()==='post' && !User.hasPrivilege(req.user,710)){
                next(new Error('EXT-UAC710: You don\'t have access to modify content'));
            }
            else if(httpmethod.toLowerCase()==='post' && !User.hasPrivilege(req.user,910)){
                next(new Error('EXT-UAC910: You don\'t have access to delete content'));
            }
            else{
                next();
            }
            break;
        case (/p-admin\/theme/gi.test(httpurl)) : 
            if(!User.hasPrivilege(req.user,120)){
                next(new Error('EXT-UAC120: You don\'t have access to view themes'));
            }
            else if(httpmethod.toLowerCase()==='post' && !User.hasPrivilege(req.user,320)){
                next(new Error('EXT-UAC320: You don\'t have access to install themes'));
            }
            else if(/enable/gi.test(httpurl) && !User.hasPrivilege(req.user,720)){
                next(new Error('EXT-UAC720: You don\'t have access to modify themes'));
            }
            else if(/delete/gi.test(httpurl) && !User.hasPrivilege(req.user,920)){
                next(new Error('EXT-UAC920: You don\'t have access to delete themes'));
            }
            else{
                next();
            }
            break;
        case (/p-admin\/extension/gi.test(httpurl)) : 
            if(!User.hasPrivilege(req.user,130)){
                next(new Error('EXT-UAC130: You don\'t have access to view extensions'));
            }
            else if(httpmethod.toLowerCase()==='post' && !User.hasPrivilege(req.user,330)){
                next(new Error('EXT-UAC330: You don\'t have access to install extensions'));
            }
            else if(/enable/gi.test(httpurl) && !User.hasPrivilege(req.user,730)){
                next(new Error('EXT-UAC730: You don\'t have access to modify extensions'));
            }
            else if(/disable/gi.test(httpurl) && !User.hasPrivilege(req.user,730)){
                next(new Error('EXT-UAC730: You don\'t have access to modify extensions'));
            }
            else if(/delete/gi.test(httpurl) && !User.hasPrivilege(req.user,930)){
                next(new Error('EXT-UAC920: You don\'t have access to delete extensions'));
            }
            else{
                next();
            }
            break;
        case (/p-admin\/setting/gi.test(httpurl)) : 
            if(!User.hasPrivilege(req.user,140)){
                next(new Error('EXT-UAC140: You don\'t have access to view settings'));
            }
            else if(httpmethod.toLowerCase()==='post' && !User.hasPrivilege(req.user,740)){
                next(new Error('EXT-UAC740: You don\'t have access to modify settings'));
            }
            else{
                next();
            }
            break;
        case httpurl==='/p-admin/users':
            if(!User.hasPrivilege(req.user,150)){
                next(new Error('EXT-UAC150: You don\'t have access to view users'));
            }
            else if(httpmethod.toLowerCase()==='post' && !User.hasPrivilege(req.user,350)){
                next(new Error('EXT-UAC350: You don\'t have access to add new users'));
            }
            else if(httpmethod.toLowerCase()==='post' && !User.hasPrivilege(req.user,750)){
                next(new Error('EXT-UAC750: You don\'t have access to modify users'));
            }
            else if(/delete/gi.test(httpurl) && !User.hasPrivilege(req.user,950)){
                next(new Error('EXT-UAC950: You don\'t have access to delete users'));
            }
            else{
                next();
            }
            break;
        case (/p-admin\/userrole/gi.test(httpurl)) : 
            if(!User.hasPrivilege(req.user,160)){
                next(new Error('EXT-UAC160: You don\'t have access to view users access'));
            }
            else if(httpmethod.toLowerCase()==='post' && !User.hasPrivilege(req.user,360)){
                next(new Error('EXT-UAC320: You don\'t have access to modify user access'));
            }
            else if(httpmethod.toLowerCase()==='post' && !User.hasPrivilege(req.user,760)){
                next(new Error('EXT-UAC750: You don\'t have access to modify user access'));
            }
            else if(/delete/gi.test(httpurl) && !User.hasPrivilege(req.user,960)){
                next(new Error('EXT-UAC960: You don\'t have access to delete user roles'));
            }
            else{
                next();
            }
            break;
        default:
            next();
            break;
    }
};

var controller = function(resources){
    logger = resources.logger;
    mongoose = resources.mongoose;
    appSettings = resources.settings;
    CoreController = new ControllerHelper(resources);
    CoreUtilities = new Utilities(resources);
    User = mongoose.model('User');
    Userrole = mongoose.model('Userrole');
    Userprivilege = mongoose.model('Userprivilege');
    Usergroup = mongoose.model('Usergroup');

    return{
        createUserprivilege:createUserprivilege,
        loadUserprivilege:loadUserprivilege,
        loadUserprivileges:loadUserprivileges,
        userprivilegeSearchResults:userprivilegeSearchResults,
        userprivilegeResults:userprivilegeResults,

        createUserrole:createUserrole,
        loadUserrole:loadUserrole,
        loadUserroles:loadUserroles,
        userroleSearchResults:userroleSearchResults,
        userroleResults:userroleResults,

        createUsergroup:createUsergroup,
        loadUsergroup:loadUsergroup,
        loadUsergroups:loadUsergroups,
        usergroupSearchResults:usergroupSearchResults,
        usergroupResults:usergroupResults,

        loadUserRoles:loadUserRoles,
        check_user_access:check_user_access,
        loadUacUsers:loadUacUsers,
        loadUserAccesControls:loadUserAccesControls
    };
};

module.exports = controller;