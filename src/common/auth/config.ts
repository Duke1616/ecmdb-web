/**
 * IAM 权限系统工程配置
 */
export const PERMISSION_CONFIG = {
  /**
   * 是否开启前端权限校验
   * - true: 严格执行权限检查 (生产环境建议)
   * - false: 绕过所有前端按钮和勾选的权限校验 (开发/调试模式)
   */
  ENABLE: true,

  /**
   * 是否允许超级管理员豁免
   * - true: isAdmin 用户自动拥有所有权限
   */
  ADMIN_BYPASS: true
}
