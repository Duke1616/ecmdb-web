export default function registerParallel(lf: any) {
  lf.register("parallel", ({ PolygonNode, PolygonNodeModel, h }: any) => {
    class Node extends PolygonNode {
      getIconShape() {
        const { model } = this.props
        const { stroke } = model.getNodeStyle()
        return h(
          "svg",
          {
            x: 20,
            y: 18,
            width: 30,
            height: 30,
            viewBox: "0 0 1126 1024"
          },
          h("path", {
            fill: stroke,
            d: "M445.146171 956.736653V578.546691H66.853829C29.894821 578.546691 0 548.65187 0 511.692861c0-36.754249 29.894821-66.853829 66.853829-66.853829h378.292342V66.853829c0-36.856629 29.894821-66.853829 66.853829-66.853829 36.754249 0 66.853829 29.894821 66.853829 66.853829v378.292342h378.087583c36.959008 0 66.853829 29.894821 66.853829 66.853829 0 36.754249-29.894821 66.853829-66.853829 66.853829H578.64907v378.292342c0 36.754249-29.894821 66.853829-66.853829 66.853829-36.754249-0.409518-66.64907-30.20196-66.64907-67.263347z"
          })
        )
      }
      getShape() {
        const { model } = this.props
        const { width, height, x, y, points } = model
        const { fill, fillOpacity, strokeWidth, stroke, strokeOpacity } = model.getNodeStyle()
        const transform = `matrix(1 0 0 1 ${x - width / 2} ${y - height / 2})`
        const pointsPath = points.map((point: any[]) => point.join(",")).join(" ")
        return h(
          "g",
          {
            transform
          },
          [
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
        )
      }
    }
    class Model extends PolygonNodeModel {
      constructor(data: { text: { value: any; x?: any; y?: any }; x: any; y: number }, graphModel: any) {
        data.text = {
          value: (data.text && data.text.value) || "",
          x: data.x,
          y: data.y + 50
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
        const lenght = 34
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
