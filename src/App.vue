<script setup>
import { ref } from 'vue'
import { connect as connectSdr, disconnect, receive, device, frequency, totalReceived, processedData } from  './utils/sdr'

const error = ref(null)

async function connect() {
  error.value = null
  try {
    await connectSdr()
    receive().catch(e => error.value = e)
  } catch (e) {
    error.value = e
    console.log(e.message)
  }
}
</script>

<template>
<div>
{{ device }} Total received:{{ (totalReceived / 1024 / 1024).toFixed(2) }}MB, Processed:{{ (processedData / 1024 / 1024).toFixed(2) }}MB
</div>
<button @click="connect" v-if="!device">连接</button>
<button @click="disconnect" v-if="device">断开</button>

<p v-if="error">
  <pre v-if="!error.stack">{{ error }}</pre>
  <pre v-if="error.stack">{{ error.stack }}</pre>
</p>
</template>

<style scoped>
</style>
