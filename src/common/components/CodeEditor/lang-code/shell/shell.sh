#!/bin/bash
# 脚本描述信息

## 传递工单提交信息
args=$1

## 为了防止重复编写脚本，设定环境变量机制，变量请通过 Runner 模块进行自定义配置
## 存储在临时文件中，通过 source 导入
vars=$2
source $vars

# 脚本主体
main() {
    # 脚本的主要逻辑
    echo $args
}

main $@
