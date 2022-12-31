<script setup>
import { ref } from 'vue'
import { connect as connectSdr, getDeviceName } from  './utils/sdr'
import Decoder from './utils/decode-worker'
import Player from './utils/audio'

let sdr = null
const decoder = new Decoder()
const player = new Player()

const device = ref('')
const totalReceived = ref(0)
const freq = 94.5 * 1e6
const SAMPLE_RATE = 1024 * 1e3 // Must be a multiple of 512 * BUFS_PER_SEC
const BUFS_PER_SEC = 5
const SAMPLES_PER_BUF = Math.floor(SAMPLE_RATE / BUFS_PER_SEC)

async function connect() {
  sdr = await connectSdr()
  device.value = getDeviceName(sdr)

  await sdr.open({ ppm: 0.5 })
  await sdr.setSampleRate(SAMPLE_RATE)
  await sdr.setCenterFrequency(freq)
  await sdr.resetBuffer()
  while (device.value) {
    const samples = await sdr.readSamples(SAMPLES_PER_BUF)
    postMessage({ type: 'samples', samples })
  }
}

window.addEventListener('message', ({ data }) => {
  switch (data.type) {
    case 'samples':
      const samples = data.samples
      totalReceived.value += samples.byteLength
      let [left, right] = decoder.process(samples, true, 0)
      left = new Float32Array(left);
      right = new Float32Array(right);
      player.play(left, right, 50, 30)
      break;
  }
})

async function disconnect() {
  device.value = ''
  await new Promise(r => setTimeout(r, 200))
  sdr.close()
  sdr = null
}
</script>

<template>
<div>
{{ device }} Total received:{{ (totalReceived / 1024 / 1024).toFixed(2) }}MB
</div>
<button @click="connect" v-if="!device">连接</button>
<button @click="disconnect" v-if="device">断开</button>
</template>

<style scoped>
</style>
