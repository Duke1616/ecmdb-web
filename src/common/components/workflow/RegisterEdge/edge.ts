export default function registerPolyline(lf: any) {
  lf.register("polyline", ({ PolylineEdge, PolylineEdgeModel, h }: any) => {
    class ConnnectionModel extends PolylineEdgeModel {
      constructor(data: any, graphModel: any) {
        super(data, graphModel)
      }
      setHovered(isHovered: any) {
        super.setHovered(isHovered)
        this.isAnimation = isHovered
      }
      getEdgeStyle() {
        const style = super.getEdgeStyle()
        const {
          properties: { is_pass, is_skipped }
        } = this

        // 如果线条被跳过（系统自动跳过），显示为灰色
        if (is_skipped) {
          style.stroke = "#9ca3af" // 灰色
          style.strokeWidth = 2
          style.strokeDasharray = "3 3" // 虚线效果，增强跳过感
        }
        // 如果节点审批通过，颜色变红
        else if (is_pass) {
          style.stroke = "red"
          style.strokeWidth = 3
        }

        return style
      }

      getTextStyle() {
        const style = super.getTextStyle()
        const {
          properties: { is_skipped }
        } = this
        if (is_skipped) {
          style.fill = "#9ca3af"
          style.fontSize = 12
        }
        return style
      }

      initEdgeData(data: any) {
        super.initEdgeData(data)

        // 仅在被跳过（is_skipped）时处理文本
        if (data.properties && data.properties.is_skipped) {
          // 判断是否有有效文字（非空 非纯空格）
          const hasValidText =
            this.text && typeof this.text === "object" && this.text.value && this.text.value.trim().length > 0

          if (hasValidText) {
            // 如果原本有有效文字，保持原样显示
          } else {
            // 如果原本没有有效 text，显示 "Skip"
            if (this.text && typeof this.text === "object") {
              // 如果有对象但无有效值，直接修改 value，保留位置信息
              this.text.value = "Skip"
            } else {
              // 如果连对象都没有，创建新的
              this.text = { value: "Skip", draggable: false } as any
            }
          }
        }
      }
      getEdgeAnimationStyle() {
        const style = super.getEdgeAnimationStyle()
        style.animationName = "lf_animate_dash"
        return style
      }
    }
    class Connection extends PolylineEdge {
      getShape() {
        const { model } = this.props
        const { id, properties } = model
        const shape = super.getShape()

        if (properties.isDebug && model.points) {
          const { points } = model
          let pointsList: number[][] = []
          if (typeof points === "string") {
            pointsList = points.split(" ").map((p: string) => p.split(",").map(Number))
          } else if (Array.isArray(points)) {
            pointsList = points.map((p: any) => [p.x, p.y])
          }

          if (pointsList.length > 0) {
            const midIndex = Math.floor(pointsList.length / 2)
            const midPoint = pointsList[midIndex]

            return h("g", {}, [
              shape,
              h(
                "text",
                {
                  x: midPoint[0],
                  y: midPoint[1] - 8,
                  textAnchor: "middle",
                  fill: "#10b981",
                  fontSize: 9,
                  fontWeight: "600",
                  style: "pointer-events: none; opacity: 0.6;"
                },
                id.substring(0, 8)
              )
            ])
          }
        }
        return shape
      }
    }
    return {
      view: Connection,
      model: ConnnectionModel
    }
  })
}
