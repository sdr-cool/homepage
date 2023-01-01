<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
    required: true
  },
  title: {
    type: String,
    default: '',
    required: false
  }
})
</script>

<template>
<div class="dialog" v-if="modelValue">
  <div class="content">
    <div class="title">
      {{ title || "　" }}
      <button class="close" @click="$emit('update:modelValue', false)">X</button>
    </div>
    <slot />
  </div>
</div>
</template>

<style scoped lang="scss">
.dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 999;
  display: flex;
  place-items: center;

  .content {
    max-width: 500px;
    min-width: 300px;
    margin: 0 auto;
    background-color: #ddd;
    position: relative;
    padding: 0 5px 5px 5px;
    border-radius: 8px;

    .title {
      background-color: #f9f9f9;
      font-size: 18px;
      font-weight: bold;
      line-height: 38px;
      margin: 0 -5px 10px -5px;
      border-radius: 8px 8px 0 0;
    }

    .close {
      position: absolute;
      right: 0;
      top: 0;
      padding: 5px;
      width: 25px;
    }
  }
}

</style>