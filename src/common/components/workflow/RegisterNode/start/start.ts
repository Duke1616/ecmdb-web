export default function registerStart(lf: any) {
  lf.register("start", ({ CircleNode, CircleNodeModel, h }: any) => {
    class StartNode extends CircleNode {
      getLabelShape() {
        const { model } = this.props
        const { x, y } = model
        const stroke = "#404040"
        return h(
          "svg",
          {
            x: x - 20,
            y: y - 20,
            width: 40,
            height: 40,
            viewBox: "0 0 1024 1024"
          },
          h("path", {
            fill: stroke,
            d: "M429.504 309.952c-12.928-13.056-39.104-4.224-39.104 17.344v380.672c0 17.344 21.76 30.528 39.104 17.344l191.104-176.256a42.24 42.24 0 0 0 0-60.928l-191.104-178.176z"
          })
        )
      }
      getShape() {
        const { model } = this.props
        const { x, y, r, properties } = model
        const { fill, stroke, strokeWidth } = model.getNodeStyle()
        const children = [
          h("circle", {
            cx: x,
            cy: y,
            r,
            fill,
            stroke,
            strokeWidth
          }),
          this.getLabelShape()
        ]

        if (properties && properties.isDebug) {
          children.push(
            h(
              "text",
              {
                x,
                y: y - r - 8,
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

        return h("g", {}, children)
      }
    }
    class StartModel extends CircleNodeModel {
      // 自定义节点形状属性
      initNodeData(data: any) {
        data.text = {
          value: (data.text && data.text.value) || "",
          x: data.x,
          y: data.y + 45,
          dragable: false,
          editable: true
        }
        super.initNodeData(data)
      }

      // 设置自定义节点形状属性
      setAttributes() {
        this.r = 30
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
