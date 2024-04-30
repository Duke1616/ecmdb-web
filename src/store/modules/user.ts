import { ref } from 'vue'
import { defineStore } from 'pinia'
import { LoginLdap } from '@/api/login'
import { type LoginRequestData } from '@/api/login/types/login'

export const useUserStore = defineStore('user', () => {
  const username = ref<string>('')

  /** 登录 */
  const login = async ({ username, password }: LoginRequestData) => {
    const { data } = await LoginLdap({ username, password })
  }

  return { username, login }
})
