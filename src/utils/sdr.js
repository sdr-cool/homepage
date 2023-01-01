import { ref } from 'vue'

import RtlSdr from 'rtlsdrjs'
import Decoder from './decode-worker'
import Player from './audio'

const SAMPLE_RATE = 1024 * 1e3 // Must be a multiple of 512 * BUFS_PER_SEC
const BUFS_PER_SEC = 20
const SAMPLES_PER_BUF = Math.floor(SAMPLE_RATE / BUFS_PER_SEC)

let sdr = null
let decoder = null
let player = null

export const frequency = ref(88.7 * 1e6)
export const device = ref('')
export const totalReceived = ref(0)
export const processedData = ref(0)

async function connect() {
  sdr = await RtlSdr.requestDevice()
  device.value = sdr._usbDevice._device.productName
}

async function disconnect() {
  const toClose = sdr
  sdr = null
  device.value = ''
  await new Promise(r => setTimeout(r, 1000 / BUFS_PER_SEC + 10))
  toClose.close()
}

async function receive() {
  decoder = decoder || new Decoder()
  player = player || new Player()
  await sdr.open({ ppm: 0.5 })
  await sdr.setSampleRate(SAMPLE_RATE)
  await sdr.setCenterFrequency(frequency.value)
  await sdr.resetBuffer()
  while (sdr) {
    const samples = await sdr.readSamples(SAMPLES_PER_BUF)
    postMessage({ type: 'samples', samples, ts: Date.now() })
  }
}

window.addEventListener('message', ({ data }) => {
  switch (data.type) {
    case 'samples':
      const samples = data.samples
      totalReceived.value += samples.byteLength
      let [left, right] = decoder.process(samples, true, 0)
      processedData.value += left.byteLength + right.byteLength
      left = new Float32Array(left);
      right = new Float32Array(right);
      player.play(left, right, 40, 20);
      break;
  }
})

export { connect, disconnect, receive }