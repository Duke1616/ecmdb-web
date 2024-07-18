export default function registerInclusion(lf: any) {
  lf.register("inclusion", ({ PolygonNode, PolygonNodeModel, h }: any) => {
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
            d: "M512 105.8816c-224.0512 0-406.1184 182.272-406.1184 406.1184S287.9488 918.1184 512 918.1184 918.1184 736.0512 918.1184 512 736.0512 105.8816 512 105.8816z m0 918.1184c-136.8064 0-265.3184-53.3504-362.0864-149.9136C53.1456 777.3184 0 648.8064 0 512s53.3504-265.3184 149.9136-362.0864C246.6816 53.1456 375.1936 0 512 0s265.3184 53.3504 362.0864 149.9136c96.768 96.768 149.9136 225.28 149.9136 362.0864s-53.1456 265.3184-149.9136 362.0864S648.8064 1024 512 1024z"
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
