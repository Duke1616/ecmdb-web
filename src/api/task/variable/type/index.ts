export interface VariablePage {
  offset?: number
  limit?: number
}

export interface ListVariablesReq extends VariablePage {}

export interface CreateVariableReq {
  key: string
  value: string
  secret: boolean
}

export interface UpdateVariableReq extends CreateVariableReq {
  id: number
}

export interface VariableVO {
  id: number
  key: string
  value: string
  secret: boolean
  ctime: number
  utime: number
}

export interface ListVariablesResp {
  total: number
  variables: VariableVO[]
}
