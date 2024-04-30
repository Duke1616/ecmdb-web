let BASE_URL = ""
if (import.meta.env.PROD) {
  BASE_URL = "http://127.0.0.1:8000"
} else {
  BASE_URL = "http://127.0.0.1:8000"
}

// console.log(BASE_URL)

// // 3.通过创建.env文件直接创建变量
// console.log(import.meta.env.VITE_URL)

export const TIME_OUT = 10000
export { BASE_URL }
