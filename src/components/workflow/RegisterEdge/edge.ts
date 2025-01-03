export default function registerPolyline(lf: any) {
  lf.register("polyline", ({ PolylineEdge, PolylineEdgeModel }: any) => {
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
        // 如果节点审批通过，颜色变红
        const {
          properties: { is_pass }
        } = this
        if (is_pass) {
          style.stroke = "red"
          style.strokeWidth = 3
        }

        return style
      }
      getEdgeAnimationStyle() {
        const style = super.getEdgeAnimationStyle()
        style.animationName = "lf_animate_dash"
        return style
      }
    }
    return {
      view: PolylineEdge,
      model: ConnnectionModel
    }
  })
}
