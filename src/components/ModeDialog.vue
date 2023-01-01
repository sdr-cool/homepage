<script setup>
import PopupDialog from './PopupDialog.vue'
import { mode } from '../utils/sdr-vals'

const models = ['FM', 'NFM', 'AM', 'LSB', 'USB']

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
    required: true
  }
})
</script>

<template>
<popup-dialog title="Mode" :model-value="modelValue" @update:modelValue="$emit('update:modelValue', false)">
  <div v-for="m in models"><button @click="mode = m" :class="{ active: m === mode }">{{ m }}</button></div>
</popup-dialog>
</template>

<style scoped lang="scss">
button {
  width: 80px;
  margin: 5px;

  &.active {
    background-color: #ccc;
  }
}
</style>