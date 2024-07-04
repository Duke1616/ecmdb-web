export default function registerUser(lf: any) {
  lf.register("condition", ({ PolygonNode, PolygonNodeModel, h }: any) => {
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
            d: "M222.23752 675.451188a32.380701 32.380701 0 0 0 8.319152-26.429307 301.409294 301.409294 0 0 1-2.75172-32.316708c-1.343863-51.450758 11.134866-96.054214 37.116219-132.658485 45.115404-63.225559 117.364044-83.511492 170.094672-98.293987 35.836349-9.982983 61.561728-12.606716 82.359609-14.590513 22.845673-2.303765 34.300506-3.391654 50.618844-12.798696a113.012487 113.012487 0 0 0 55.866308-98.102006V231.6564a32.188721 32.188721 0 0 0-14.398533-26.557294 111.860604 111.860604 0 0 1-49.594947-94.582365A112.244565 112.244565 0 0 1 670.255878 0.127987a111.860604 111.860604 0 0 1 63.8015 205.035112 31.99674 31.99674 0 0 0-14.078566 26.493301v560.646884c0 10.686911 5.503439 20.605901 14.398533 26.621288 30.268916 20.349927 50.170889 55.16238 49.594948 94.582364a111.988591 111.988591 0 1 1-174.062268-94.774344 31.99674 31.99674 0 0 0 14.078566-26.493301V446.162547a5.311459 5.311459 0 0 0-7.999185-4.60753h-0.127987c-34.300506 19.709992-62.073676 22.397718-88.950938 25.085444a343.644991 343.644991 0 0 0-65.913285 11.518827c-43.259593 12.094768-92.406586 25.853366-117.875991 61.561728-17.022266 23.805575-20.605901 53.434556-19.070058 79.60789 0.639935 12.606716 8.63912 23.485607 20.349927 28.157131A112.052585 112.052585 0 0 1 416.009779 752.627326a111.988591 111.988591 0 1 1-193.772259-77.304125z"
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
