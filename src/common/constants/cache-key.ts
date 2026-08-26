const SYSTEM_NAME = "ecmdb"

/** 缓存数据时用到的 Key */
class CacheKey {
  static readonly ACCESS_TOKEN = `${SYSTEM_NAME}-access-token-key`
  static readonly TOKEN_CARRIER = `${SYSTEM_NAME}-token-carrier-key`
  static readonly SESSION_ESTABLISHED = `${SYSTEM_NAME}-session-established-key`
  static readonly CONFIG_LAYOUT = `${SYSTEM_NAME}-config-layout-key`
  static readonly SIDEBAR_STATUS = `${SYSTEM_NAME}-sidebar-status-key`
  static readonly ACTIVE_THEME_NAME = `${SYSTEM_NAME}-active-theme-name-key`
  static readonly VISITED_VIEWS = `${SYSTEM_NAME}-visited-views-key`
  static readonly CACHED_VIEWS = `${SYSTEM_NAME}-cached-views-key`
}

export default CacheKey
