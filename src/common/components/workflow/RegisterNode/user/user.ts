export default function registerUser(lf: any) {
  lf.register("user", ({ PolygonNode, PolygonNodeModel, h }: any) => {
    class Node extends PolygonNode {
      getIconShape() {
        const { model } = this.props
        const { stroke } = model.getNodeStyle()
        return h(
          "svg",
          {
            x: 19,
            y: 16,
            width: 40,
            height: 40,
            viewBox: "0 0 1024 1024"
          },
          h("path", {
            fill: stroke,
            d: "M810.666667 938.666667v-85.333334c0-45.269333-18.005333-88.576-50.005334-120.576s-75.306667-50.005333-120.576-50.005333h-256c-45.269333 0-88.576 18.005333-120.576 50.005333S213.333333 808.085333 213.333333 853.333333v85.333334h597.333334zM512 597.333333c45.269333 0 88.576-18.005333 120.576-50.005333s50.005333-75.306667 50.005333-120.576-18.005333-88.576-50.005333-120.576S557.269333 256 512 256s-88.576 18.005333-120.576 50.005333-50.005333 75.306667-50.005333 120.576 18.005333 88.576 50.005333 120.576S466.730667 597.333333 512 597.333333z"
          })
        )
      }
      getShape() {
        const { model } = this.props
        const { width, height, x, y, points, properties } = model
        const { fill, fillOpacity, strokeWidth, stroke, strokeOpacity } = model.getNodeStyle()
        const transform = `matrix(1 0 0 1 ${x - width / 2} ${y - height / 2})`
        const pointsPath = points.map((point: any[]) => point.join(",")).join(" ")
        const children = [
          h("polygon", {
            points: pointsPath,
            fill,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity
          }),
          this.getIconShape()
        ]

        if (properties && properties.isDebug) {
          children.push(
            h(
              "text",
              {
                x: width / 2,
                y: -8,
                textAnchor: "middle",
                fill: "#94a3b8",
                fontSize: 9,
                fontWeight: "600",
                style: "pointer-events: none; opacity: 0.6;"
              },
              model.id.substring(0, 8)
            )
          )
        }

        return h("g", { transform }, children)
      }
    }
    class Model extends PolygonNodeModel {
      constructor(data: { text: { value: any; x?: any; y?: any }; x: any; y: number }, graphModel: any) {
        data.text = {
          value: (data.text && data.text.value) || "",
          x: data.x,
          y: data.y + 60
        }
        super(data, graphModel)
        // 右键菜单自由配置，也可以通过边的properties或者其他属性条件更换不同菜单
        this.menu = [
          {
            className: "lf-menu-delete",
            text: "删除",
            callback(node: { id: any }) {
              // const comfirm = window.confirm('你确定要删除吗？')
              lf.deleteNode(node.id)
            }
          },
          {
            text: "编辑",
            className: "lf-menu-item",
            callback(node: { id: any }) {
              lf.editText(node.id)
            }
          },
          {
            text: "拷贝",
            className: "lf-menu-item",
            callback(node: { id: any }) {
              lf.cloneNode(node.id)
            }
          }
        ]
      }
      initNodeData(data: any) {
        super.initNodeData(data)
      }

      setAttributes() {
        const lenght = 40
        this.points = [
          [lenght, 0],
          [lenght * 2, lenght],
          [lenght, lenght * 2],
          [0, lenght]
        ]
      }
      // 自定义锚点样式
      getAnchorStyle() {
        const style = super.getAnchorStyle()
        style.hover.r = 8
        style.hover.fill = "rgb(24, 125, 255)"
        style.hover.stroke = "rgb(24, 125, 255)"
        return style
      }
    }
    return {
      view: Node,
      model: Model
    }
  })
}
