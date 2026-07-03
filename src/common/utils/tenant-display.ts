interface TenantDisplayLike {
  name: string
  code: string
}

export const getTenantDisplayName = (tenant: TenantDisplayLike, username?: string) => {
  const loginUsername = username?.trim()
  return loginUsername && tenant.code === `${loginUsername}-personal` ? "我的个人空间" : tenant.name
}
