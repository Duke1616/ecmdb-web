import instance from '@/utils/service'
import type * as Login from './types/login'

/** 登录并返回 Token */
export function LoginLdap(data: Login.LoginRequestData) {
  return instance.post<Login.LoginResponseData>({
    url: '/user/ldap/login',
    data: data
  })
}
