<script setup>
import { ref } from 'vue'
import { connect as connectSdr, getDeviceName } from  './utils/sdr'

let sdr = null
const device = ref('')
const totalReceived = ref(0)

async function connect() {
  sdr = await connectSdr()
  device.value = getDeviceName(sdr)

  await sdr.open({ ppm: 0.5 })
  await sdr.setSampleRate(2400000)
  await sdr.setCenterFrequency(88.7 * 1e6)
  await sdr.resetBuffer()
  await sdr.readSamples(16 * 16384)
  while (device.value) {
    const samples = await sdr.readSamples(16 * 16384)
    totalReceived.value += samples.byteLength
  }
}

async function disconnect() {
  device.value = ''
  await new Promise(r => setTimeout(r, 100))
  sdr.close()
  sdr = null
}
</script>

<template>
<div>
{{ device }} {{ (totalReceived / 1024 / 1024).toFixed(2) }}MB
</div>
<button @click="connect" v-if="!device">连接</button>
<button @click="disconnect" v-if="device">断开</button>
</template>

<style scoped>
</style>
