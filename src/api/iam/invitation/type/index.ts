export interface InvitationVO {
  code: string
  tenant_name: string
  inviter_id: number
  role_codes: string[]
  max_uses: number
  used_count: number
  expire_at: number
  require_approval: boolean
}

export interface InvitationPageReq {
  offset: number
  limit: number
  keyword?: string
}

export interface InvitationPageVO {
  invitations: InvitationVO[]
  total: number
}

export interface CreateInvitationReq {
  max_uses: number
  expiry_days: number
  role_codes: string[]
  require_approval: boolean
}

export interface AcceptInvitationReq {
  code: string
}

export interface JoinRequestVO {
  id: number
  user_id: number
  username: string
  nickname: string
  invitation_code: string
  role_codes: string[]
  ctime: number
}

export interface JoinRequestPageReq {
  offset: number
  limit: number
  keyword?: string
}

export interface JoinRequestPageVO {
  requests: JoinRequestVO[]
  total: number
}

export interface HandleJoinRequestReq {
  id: number
  approve: boolean
}
