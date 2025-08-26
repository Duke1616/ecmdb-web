<script lang="ts" setup>
import { ref } from "vue"

const activeName = ref("ldap")
</script>

<template>
  <div class="login-container">
    <h3>{{ activeName }}</h3>
  </div>
</template>

<style lang="scss" scoped></style>
