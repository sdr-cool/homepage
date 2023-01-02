<script setup>
import _ from 'lodash'
import { watch } from 'vue'
import { mode } from '../utils/sdr-vals'

const models = ['FM', 'NFM', 'AM', 'LSB', 'USB']

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
    required: true
  }
})

const emit = defineEmits()
const hide = _.debounce(() => emit('update:modelValue', false), 5000)
watch(() => props.modelValue, v => v && hide())
</script>

<template>
<div class="container" v-if="modelValue">
  <button v-for="m in models" @click="mode = m, hide()" :class="{ active: m === mode }">{{ m }}</button>
</div>
</template>

<style scoped lang="scss">
.container {
  width: 100%;
  display: flex;
  margin-top: 5px;

  button {
    margin: 5px;
    flex-grow: 1;
    font-size: 12px;

    &.active {
      background-color: #ccc;
    }
  }
}
</style>