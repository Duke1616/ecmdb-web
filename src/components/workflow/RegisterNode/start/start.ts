export default function registerStart(lf: any) {
  lf.register("start", ({ CircleNode, CircleNodeModel, h }: any) => {
    class StartNode extends CircleNode {
      getLabelShape() {
        const { model } = this.props
        const { x, y } = model
        return h(
          "text",
          {
            fill: "#000000",
            fontSize: 12,
            x: x - 12,
            y: y + 4,
            width: 50,
            height: 25
          },
          "Start"
        )
      }
      getShape() {
        const { model } = this.props
        const { x, y, r } = model
        const { fill, stroke, strokeWidth } = model.getNodeStyle()
        return h("g", {}, [
          h("circle", {
            cx: x,
            cy: y,
            r,
            fill,
            stroke,
            strokeWidth
          }),
          this.getLabelShape()
        ])
      }
    }
    class StartModel extends CircleNodeModel {
      // 自定义节点形状属性
      initNodeData(data: any) {
        console.log(data, "data")
        data.text = {
          value: (data.text && data.text.value) || "",
          x: data.x,
          y: data.y + 35,
          dragable: false,
          editable: true
        }
        super.initNodeData(data)
      }
      // 设置自定义节点形状属性
      setAttributes() {
        this.r = 20
      }
      // 自定义节点样式属性
      getNodeStyle() {
        const style = super.getNodeStyle()
        return style
      }
      // 自定义锚点样式
      getAnchorStyle() {
        const style = super.getAnchorStyle()
        style.hover.r = 8
        style.hover.fill = "rgb(24, 125, 255)"
        style.hover.stroke = "rgb(24, 125, 255)"
        return style
      }
      // 自定义节点outline
      getOutlineStyle() {
        const style = super.getOutlineStyle()
        style.stroke = "#88f"
        return style
      }
      getConnectedTargetRules() {
        const rules = super.getConnectedTargetRules()
        const notAsTarget = {
          message: "起始节点不能作为连线的终点",
          validate: () => false
        }
        rules.push(notAsTarget)
        return rules
      }
    }
    return {
      view: StartNode,
      model: StartModel
    }
  })
}

// import start from "./start.vue"
// import { createApp, h } from "vue"
// export default function registerStart(lf: any) {
//   lf.register("start", ({ HtmlNode, HtmlNodeModel }: any) => {
//     class RuleNode extends HtmlNode {
//       setHtml(rootEl: any) {
//         const { model } = this.props
//         const el = document.createElement("div")
//         rootEl.innerHTML = ""
//         rootEl.appendChild(el)

//         // Vue 3 使用 createApp 来创建应用实例
//         const app = createApp({
//           render: () =>
//             h(start, {
//               properties: model.properties
//             })
//         })

//         // 挂载 Vue 应用到元素上
//         app.mount(el)
//       }
//     }
//     class RuleModel extends HtmlNodeModel {
//       createId() {
//         return randomNumber()
//       }
//       constructor(data: any, graphModel: any) {
//         super(data, graphModel)
//         this.menu = []
//       }
//       getDefaultAnchor() {
//         const { id, x, y, height } = this
//         const anchors = []
//         anchors.push({
//           x,
//           y: y + height / 2,
//           id: `${id}_outgoing`,
//           type: "outgoing"
//         })
//         return anchors
//       }
//       initNodeData(data: any) {
//         super.initNodeData(data)
//         const width = 40
//         const height = 40
//         this.width = width
//         this.height = height
//         this.radius = 50
//       }
//     }
//     return {
//       view: RuleNode,
//       model: RuleModel
//     }
//   })
// }

// export const randomNumber = () => {
//   const timestamp = Date.now().toString() // 获取当前时间戳
//   const random = Math.floor(Math.random() * 9000000000000000) + 1000000000000000 // 生成15位随机数
//   let identifier = timestamp + random.toString() // 结合时间戳和随机数
//   if (identifier.length > 19) {
//     identifier = identifier.substr(0, 19) // 如果标识符超过19位，则截取前19位
//   }
//   if (identifier.charAt(0) === "0") {
//     identifier = "1" + identifier.substr(1) // 如果开头是0，则将第一个字符替换为1
//   }
//   return identifier
// }
