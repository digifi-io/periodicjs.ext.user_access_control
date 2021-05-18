'use strict';
const periodic = require('periodicjs');
// let reactapp = periodic.locals.extensions.get('periodicjs.ext.reactapp').reactapp();
const reactappLocals = periodic.locals.extensions.get('periodicjs.ext.reactapp');
const reactapp = reactappLocals.reactapp();

const userRoleForm = (options = {}) => reactappLocals.server_manifest.forms.createForm({
  method: (options.update) ? 'PUT' : 'POST',
  action: (options.update) 
    ? `${reactapp.manifest_prefix}contentdata/standard_userroles/:id?format=json`
    : `${reactapp.manifest_prefix}contentdata/standard_userroles?format=json`,
  onSubmit:'closeModal',
  onComplete: 'refresh',
  // loadingScreen: true,
  style: {
    paddingTop:'1rem',
  },
  hiddenFields: [
  ],
  validations: [
    {
      field: 'title',
      constraints: {
        presence: {
          message: '^Please provide a title',
        },
      },
    },
    {
      field: 'userroleid',
      constraints: {
        presence: {
          message: '^Please provide a user role id',
        },
      },
    },
    
  ],
  rows: [
    {
      formElements: [
        {
          type: 'text',
          // placeholder:'Title',
          label:'Title',
          name:'title',
        },
        {
          type: 'text',
          passProps: {
            type:'number',
          },
          label:'User Role ID',
          name:'userroleid',
        },
      ],
    },
    {
      formElements: [
        {
          type: 'text',
          name: 'description',
          label: 'Description',
          // passProps: {
          //   // multiple:true,
          // },
        },
      ],
    },
    {
      formElements: [
        {
          type: 'datalist',
          name: 'privileges',
          label: 'Privileges',
          datalist: {
            multi: true,
            // selector: '_id',
            entity:'standard_userprivilege',
            resourceUrl:`${reactapp.manifest_prefix}contentdata/standard_userprivileges?format=json`
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
  asyncprops: (options.update)
    ? {
      formdata: [ 'userroledata', 'data' ],
    }
    : {},
});

const uacSettings = periodic.settings.extensions[ '@digifi/periodicjs.ext.user_access_control' ];

module.exports = {
  containers: (uacSettings.use_manifests)
    ? {
      [ `${reactapp.manifest_prefix}ext/uac/manage-roles` ]: {
        layout: {
          component: 'Container',
          props: {
            style: {
              padding: '6rem 0',
            },
          },
          children: [
            reactappLocals.server_manifest.helpers.getPageTitle({
              styles: {
                // ui: {}
              },
              title: 'Manage User Roles',
              action: {
                type: 'modal',
                title: 'Add User Role',
                pathname: `${reactapp.manifest_prefix}add-userrole`,
                buttonProps: {
                  props: {
                    color: 'isSuccess',
                  },
                },
              },
            }),
            reactappLocals.server_manifest.table.getTable({
              schemaName: 'standard_userroles',
              baseUrl: `${reactapp.manifest_prefix}contentdata/standard_userroles?format=json`,
              asyncdataprops: 'userroles',
              headers: [
                {
                  buttons: [
                    {
                      passProps: {
                        onClick: 'func:this.props.createModal',
                        onclickThisProp: 'onclickPropObject',
                        onclickProps: {
                          title: 'Edit User Role',
                          pathname: `${reactapp.manifest_prefix}edit-userrole/:id`,
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
                  sortid: 'name',
                  label: 'Name',
                },
                {
                  sortable: true,
                  sortid: 'description',
                  label: 'Description',
                  headerStyle: {
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                  columnStyle: {
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                },
                {
                  sortable: true,
                  sortid: 'userroleid',
                  label: 'User Role ID',
                },
                {
                  sortable: true,
                  sortid: 'privileges',
                  label: 'Privileges',
                  customCellLayout: {
                    component: 'DynamicLayout',
                    // ignoreReduxProps:true,
                    thisprops: {
                      items: [ 'cell' ],
                    },
                    bindprops: true,
                    props: {
                      style: {
                        display: 'block'
                      },
                      layout: {
                        bindprops: true,
                        component: 'Tag',
                        props: {
                          color: 'isDark',
                          style: {
                            margin: '0.25rem'
                          }
                        },
                        children: [
                          {
                            bindprops: true,
                            component: 'span',
                            thisprops: {
                              _children: [ 'name' ]
                            }
                          },
                          {
                            component: 'span',
                            children: ' (',
                          },
                          {
                            bindprops: true,
                            component: 'span',
                            thisprops: {
                              _children: [ 'userprivilegeid' ]
                            }
                          },
                          {
                            component: 'span',
                            children: ')',
                          },
                        ]
                      }
                    }
                  },
                },
              ],
         
            }),
          ],
        },
        resources: {
          userroles: `${reactapp.manifest_prefix}contentdata/standard_userroles?format=json`,
        },
        pageData: {
          title: 'Manage User Roles',
        },
      },
      [ `${reactapp.manifest_prefix}add-userrole` ]: {
        layout: {
          component: 'Content',
          children: [ userRoleForm(), ],
        },
        resources: {},
        pageData: {
          title: 'Add a User Role',
        },
      },
      [ `${reactapp.manifest_prefix}edit-userrole/:id` ]: {
        layout: {
          component: 'Content',
          children: [ userRoleForm({ update: true, }), ],
        },
        resources: {
          userroledata: `${reactapp.manifest_prefix}contentdata/standard_userroles/:id?format=json`,
        },
        pageData: {
          title: 'Add a User Role',
        },
      },
    }
    : {},
};