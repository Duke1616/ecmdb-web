<template>
  <div class="app-container">
    <strong>
      <span>各类OA系统, 转换为本系统工单任务</span>
    </strong>
    <br />
    <br />
    <span>因为历史包袱原因，很多审批会存在于企业微信或飞书中, 为了进行兼容这种审批</span>
    <br />
    <br />
    <span
      >举例说明： 当一个新同事入职时,需要申请自己的邮箱、企业账号、办公设备等，会把这类的权限聚合到一个模版中,
      以便于后续的审批, 但是这种情况却很难融入此平台, 因为在我的设想中, 每一个独立的个体 ,应该单独建立一个审批流
      不应耦合在一起, 设计过于粗糙，会极大提高自动化代码编写的复杂度，以及容易出现错误。</span
    >
    <br />
    <br />
    <span
      >最初的设计是想通过OA信息,根据某些匹配规则转换成本地类型工单, 比如当我发现一个审批Selection
      里面存在邮箱申请，那么我就基于本系统的邮箱模版去自动创建一个工单，通过判断工单创建来源，阻止平台测的用户节点审批，自动流转到自动化节点
      但是目前我确实没有想到很好的解决方案，故此模版搁置开发</span
    >
    <br />
    <br />
    <span>当前解决方案是兼容这种情况, 为企业微信OA审批, 绑定属于自己的流程</span>
  </div>
</template>

<script lang="ts" setup></script>

<style scoped>
.no-border-button {
  border: none !important;
  background-color: transparent !important;
  color: inherit; /* 继承父元素的文字颜色 */
  padding: 0; /* 去除默认的内边距 */
  font-size: inherit; /* 继承父元素的字体大小 */
}
</style>
