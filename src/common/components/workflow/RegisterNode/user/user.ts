export default function registerUser(lf: any) {
  lf.register("user", ({ PolygonNode, PolygonNodeModel, h }: any) => {
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
            d: "M967.111111 941.056l-14.222222-65.649778c-30.378667-148.764444-216.348444-204.686222-279.779556-230.684444-63.431111-25.941333-52.167111-111.502222-52.167111-111.502222 33.336889-51.029333 103.424-119.125333 103.424-248.035556-4.664889-130.730667-113.607111-232.846222-243.427555-228.124444-123.221333 4.437333-222.094222 103.992889-226.531556 228.124444 0.910222 93.752889 73.102222 193.080889 95.288889 223.573333 3.925333 5.12 9.955556 8.021333 16.384 7.964445H426.666667c52.224 3.697778 63.431111 70.542222 63.431111 70.542222v358.115556a20.423111 20.423111 0 0 0 21.845333 21.617777h434.176a20.423111 20.423111 0 0 0 20.024889-24.689777l0.910222-1.251556z m-557.340444-77.880889h-332.231111a20.423111 20.423111 0 0 0-20.650667 20.138667v61.44c0 11.320889 9.102222 20.48 20.309333 20.48H411.306667a20.423111 20.423111 0 0 0 20.650666-20.195556v-61.383111a20.423111 20.423111 0 0 0-20.650666-20.48h-1.479111z m0-145.749333h-332.231111a20.423111 20.423111 0 0 0-20.650667 20.195555v61.383111c0 11.377778 9.102222 20.48 20.309333 20.48H411.306667a20.423111 20.423111 0 0 0 20.650666-20.138666v-61.44c0-11.320889-9.102222-20.48-20.309333-20.48h-1.820444z m0-145.692445h-332.231111a20.423111 20.423111 0 0 0-20.650667 20.138667v61.44c0 11.264 9.102222 20.48 20.309333 20.48H411.306667a20.423111 20.423111 0 0 0 20.650666-20.195556V592.213333a20.423111 20.423111 0 0 0-20.650666-20.48h-1.479111z"
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
        const lenght = 35
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
