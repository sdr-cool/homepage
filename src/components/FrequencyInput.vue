<script setup>
import { ref, watch } from 'vue'
import { frequency, tuningFreq } from '../utils/sdr-vals'

const inputVal = ref(0)

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
    required: true
  }
})

watch(() => props.modelValue, v => {
  tuningFreq.value = 0
  if (v) {
    inputVal.value = frequency.value / 1e6
  }
})

const emit = defineEmits()
function setFrequency() {
  frequency.value = inputVal.value * 1e6
  tuningFreq.value = 0
  emit('update:modelValue', false)
}
</script>

<template>
<div class="container" v-if="modelValue">
  <input v-model="inputVal" type="number" step="0.01" />
  <div class="unit">MHz</div>
  <button @click="setFrequency">OK</button>
</div>
</template>

<style scoped lang="scss">
.container {
  margin-top: 10px;
  width: 100%;
  display: flex;

  input {
    flex-grow: 1;
    text-align: center;
  }

  .unit {
    margin: 0 5px;
    align-self: flex-end;
  }

  button {
    font-size: 13px;
  }
}
</style>