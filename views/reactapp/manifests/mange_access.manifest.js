'use strict';
const periodic = require('periodicjs');
const capitalize = require('capitalize');
const pluralize = require('pluralize');
const reactappLocals = periodic.locals.extensions.get('periodicjs.ext.reactapp');
const reactapp = reactappLocals.reactapp();

function userRoleForm(options = {}) {
  const { entity } = options;
  const entityDisplay = getEntityDisplay(entity);
  return reactappLocals.server_manifest.forms.createForm({
    method: (options.update) ? 'PUT' : 'POST',
    action: (options.update) 
      ? `${reactapp.manifest_prefix}contentdata/standard_${entityDisplay.plural}/:id?format=json`
      : `${reactapp.manifest_prefix}contentdata/standard_${entityDisplay.plural}?format=json`,
    onSubmit:'closeModal',
    onComplete: 'refresh',
    // loadingScreen: true,
    style: {
      paddingTop:'1rem',
    },
    hiddenFields: [
    ],
    // validations: [ ],
    rows: [
      {
        formElements: [
          {
            type: 'text',
            passProps: {
              disabled: true,
              state: 'isDisabled',
            },
            label:'Email',
            name:'email',
          },
        ],
      },
      {
        formElements: [
          {
            type: 'datalist',
            name: 'userroles',
            label: 'User Roles',
            datalist: {
              multi: true,
              // selector: '_id',
              entity:'standard_userrole',
              resourceUrl:`${reactapp.manifest_prefix}contentdata/standard_userroles?format=json`
            }
            // passProps: {
            //   // multiple:true,
            // },
          },
        ],
      },
      {
        formElements: [
          {
            type: 'submit',
            value: (options.update) ? 'Update User Role' : 'Add User Role',
            layoutProps: {
              style: {
                textAlign:'center',
              },
            },
          },
        ],
      },
    ],
    actionParams: (options.update)
      ? [
        {
          key: ':id',
          val: '_id',
        },
      ]
      : undefined,
    // hiddenFields
    formProps: {
      flattenFormData:false,
    },
    asyncprops: (options.update)
      ? {
        formdata: [ 'accessdata', 'data' ],
      }
      : {},
  });
}

function getEntityDisplay(entity) {
  return {
    plural: pluralize(entity),
    capitalized: capitalize(entity),
    pluralCapitalized: pluralize(capitalize(entity)),
  };
}

function getPageTitle(options) {
  const { entity } = options;
  const entityDisplay = getEntityDisplay(entity);
  return reactappLocals.server_manifest.helpers.getPageTitle({
    styles: {
      // ui: {}
    },
    title: `Manage ${entityDisplay.capitalized} Access`,
    // action: {
    //   type: 'modal',
    //   title: `Manage ${entityDisplay.capitalized} Access`,
    //   pathname: `${reactapp.manifest_prefix}edit-${entity}-access`,
    //   buttonProps: {
    //     props: {
    //       color:'isSuccess',
    //     },
    //   },
    // },
  })
}

function getAccessPage(options) {
  const { entity } = options;
  const entityDisplay = getEntityDisplay(entity);
  return {
    layout: {
      component: 'Container',
      props: {
        style: {
          padding: '6rem 0',
        },
      },
      children: [
        getPageTitle({
          entity,
        }),
        reactappLocals.server_manifest.table.getTable({
          schemaName: `standard_${entityDisplay.plural}`,
          baseUrl: `${reactapp.manifest_prefix}contentdata/standard_${entityDisplay.plural}?format=json`,
          asyncdataprops: 'accessdata',
          headers: [
            {
              buttons: [
                {
                  passProps: {
                    onClick: 'func:this.props.createModal',
                    onclickThisProp: 'onclickPropObject',
                    onclickProps: {
                      title: `Edit ${entityDisplay.capitalized} Access`,
                      pathname: `${reactapp.manifest_prefix}edit-${entity}-access/:id`,
                      params: [
                        {
                          key: ':id',
                          val: '_id',
                        }
                      ],
                    },
                    buttonProps: {
                      color: 'isInfo',
                      buttonStyle: 'isOutlined',
                      icon: 'fa fa-pencil',
                    },
                  },
                }
              ],
              sortid: '_id',
              sortable: true,
              label: 'ID',
            },
            {
              sortable: true,
              sortid: 'email',
              label: 'Email',
            },
            {
              sortable: true,
              sortid: 'firstname',
              label: 'First name',
            },
            {
              sortable: true,
              sortid: 'lastname',
              label: 'Last Name',
            },
            {
              sortable: true,
              sortid: 'userroles',

              customCellLayout: {
                component: 'DynamicLayout',
                // ignoreReduxProps:true,
                thisprops: {
                  items:['cell'],
                },
                bindprops:true,
                props: {
                  layout: {
                    bindprops:true,
                    component: 'Tag',
                    props: {
                      color: 'isDark',
                      style: {
                        margin:'0.25rem'
                      }
                    },
                    children: [
                      {
                        bindprops:true,
                        component: 'span',
                        thisprops: {
                          _children:['name']
                        }
                      },
                      // {
                      //   component: 'span',
                      //   children:': ',
                      // },
                      // {
                      //   bindprops:true,
                      //   component: 'span',
                      //   thisprops: {
                      //     _children:['userroleid']
                      //   }
                      // }
                    ]
                  }
                }
              },
              label: 'User Roles',
            },
          ],       
        }),
      ],
    },
    resources: {
      accessdata: `${reactapp.manifest_prefix}contentdata/standard_${entityDisplay.plural}?format=json`,
    },
    pageData: {
      title: `Manage ${entityDisplay.capitalized} Access`,
    },
  };
}

function getModalPage(options) {
  const { entity } = options;
  const entityDisplay = getEntityDisplay(entity);
  return {
    layout: {
      component: 'Content',
      children: [
        userRoleForm({
          update: true, 
          entity,
        }),
      ],
    },
    resources: {
      accessdata: `${reactapp.manifest_prefix}contentdata/standard_${entityDisplay.plural}/:id?format=json`,
    },
    pageData: {
      title: `Edit ${entityDisplay.capitalized} Access`,
    },
  };
}

const uacSettings = periodic.settings.extensions[ '@digifi/periodicjs.ext.user_access_control' ];

module.exports = {
  containers: (uacSettings.use_manifests)
    ? {
      [ `${reactapp.manifest_prefix}ext/uac/account-access` ]: getAccessPage({ entity: 'account' }),
      [ `${reactapp.manifest_prefix}ext/uac/user-access` ]: getAccessPage({ entity: 'user' }),
      [ `${reactapp.manifest_prefix}edit-account-access/:id` ]: getModalPage({ entity: 'account' }),
      [ `${reactapp.manifest_prefix}edit-user-access/:id` ]: getModalPage({ entity: 'user' }),
    }
    : {},
};