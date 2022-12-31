<script setup>
import { ref } from 'vue'
import Sdr from  './utils/sdr'

const sdr = ref(null)
const device = ref('')

async function connect() {
  sdr.value = new Sdr()
  await sdr.value.connect()
  device.value = sdr.value.device
}
</script>

<template>
<div>
{{ device }}
</div>
<button @click="connect">连接</button>
</template>

<style scoped>
</style>
