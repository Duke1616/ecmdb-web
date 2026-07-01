import {
  PLUGIN_ACTION_PLACEMENT,
  PLUGIN_CARDINALITY,
  PLUGIN_DIRECTION,
  PLUGIN_RELATION_TYPE,
  PLUGIN_UI,
  type Binding,
  type Definition,
  type Plugin
} from "@/api/cmdb/plugin/types/plugin"

export const createEmptyDefinitionTemplate = (): Definition => ({
  plugin: {
    uid: "",
    name: "",
    type: "custom",
    version: "1.0.0",
    enabled: true,
    actions: [],
    config: {}
  },
  bindings: []
})

export const createEmptyPluginTemplate = (): Plugin => ({
  uid: "",
  name: "",
  type: "custom",
  version: "1.0.0",
  enabled: true,
  actions: [],
  config: {}
})

export const createEmptyBindingTemplate = (): Binding => ({
  uid: "",
  plugin_id: "",
  model_uid: "",
  enabled: true,
  specs: [],
  config: {}
})

export const createSSHDefinitionTemplate = (): Definition => ({
  plugin: {
    uid: "builtin.ssh",
    name: "SSH",
    type: "builtin",
    version: "1.0.0",
    enabled: true,
    actions: [
      {
        action: "terminal",
        name: "SSH 终端",
        icon: "terminal",
        placement: PLUGIN_ACTION_PLACEMENT.ResourceDetailActions,
        ui: PLUGIN_UI.BuiltinTerminal
      },
      {
        action: "sftp",
        name: "文件管理",
        icon: "folder",
        placement: PLUGIN_ACTION_PLACEMENT.ResourceDetailActions,
        ui: PLUGIN_UI.BuiltinSFTP
      }
    ],
    config: {}
  },
  bindings: [
    {
      uid: "builtin.ssh.host",
      plugin_id: "builtin.ssh",
      model_uid: "host",
      enabled: true,
      specs: [
        {
          name: "target",
          model_uid: "host",
          cardinality: PLUGIN_CARDINALITY.One,
          required: true,
          fields: {
            host: "ip",
            port: "port",
            username: "username",
            password: "password",
            private_key: "private_key",
            auth_type: "auth_type",
            sort: "sort"
          },
          required_fields: ["host", "username"],
          children: [
            {
              name: "gateways",
              model_uid: "AuthGateway",
              relation_type: PLUGIN_RELATION_TYPE.Default,
              direction: PLUGIN_DIRECTION.Source,
              cardinality: PLUGIN_CARDINALITY.Many,
              required: false,
              fields: {
                host: "ip",
                port: "port",
                username: "username",
                password: "password",
                private_key: "private_key",
                auth_type: "auth_type",
                sort: "sort"
              }
            }
          ]
        }
      ],
      config: {}
    }
  ]
})
