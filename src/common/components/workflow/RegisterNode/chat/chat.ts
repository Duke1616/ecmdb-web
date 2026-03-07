export default function registerChat(lf: any) {
  lf.register("chat", ({ PolygonNode, PolygonNodeModel, h }: any) => {
    class Node extends PolygonNode {
      getIconShape() {
        const { model } = this.props
        const { width, height } = model
        const { stroke } = model.getNodeStyle()
        const iconSize = 32
        const x = (width - iconSize) / 2
        const y = (height - iconSize) / 2

        return h(
          "svg",
          {
            x,
            y,
            width: iconSize,
            height: iconSize,
            viewBox: "0 0 1024 1024"
          },
          h("path", {
            fill: stroke,
            d: "M832 192H192c-35.3 0-64 28.7-64 64v448c0 35.3 28.7 64 64 64h160l128 128 128-128h160c35.3 0 64-28.7 64-64V256c0-35.3-28.7-64-64-64z m-320 448c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z m192 0c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z m-384 0c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z"
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
      constructor(data: any, graphModel: any) {
        data.text = {
          value: (data.text && data.text.value) || "",
          x: data.x,
          y: data.y + 60
        }
        super(data, graphModel)

        this.menu = [
          {
            className: "lf-menu-delete",
            text: "删除",
            callback(node: any) {
              lf.deleteNode(node.id)
            }
          },
          {
            text: "编辑",
            className: "lf-menu-item",
            callback(node: any) {
              lf.editText(node.id)
            }
          },
          {
            text: "拷贝",
            className: "lf-menu-item",
            callback(node: any) {
              lf.cloneNode(node.id)
            }
          }
        ]
      }

      initNodeData(data: any) {
        super.initNodeData(data)
      }

      setAttributes() {
        const length = 40
        this.points = [
          [length, 0],
          [length * 2, length],
          [length, length * 2],
          [0, length]
        ]
      }

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
