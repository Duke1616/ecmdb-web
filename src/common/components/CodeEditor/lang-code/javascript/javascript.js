// JavaScript 脚本模板
// 脚本描述信息

function main() {
  try {
    // 解析传入的参数
    const args = JSON.parse(process.argv[2])
    const variables = JSON.parse(process.argv[3])

    console.log("Args:", args)
    console.log("Variables:", variables)

    // 脚本的主要逻辑
    console.log("执行 JavaScript 脚本")
  } catch (error) {
    console.error("error:", error)
  }
}

// 从变量 JSON 中获取值的辅助函数
function getValueFromVariablesJson(jsonData, keyToFind) {
  for (const item of jsonData) {
    if (item.Key === keyToFind) {
      return item.Value
    }
  }
  throw new Error(`Key '${keyToFind}' not found in the JSON data.`)
}

// 执行主函数
main()
