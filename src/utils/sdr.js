import { ref, watch } from 'vue'

import RtlSdr from 'rtlsdrjs'
import Decoder from './decode-worker'
import Player from './audio'

const SAMPLE_RATE = 1024 * 1e3 // Must be a multiple of 512 * BUFS_PER_SEC
const BUFS_PER_SEC = 32
const SAMPLES_PER_BUF = Math.floor(SAMPLE_RATE / BUFS_PER_SEC)
const MIN_FREQ = 5e5
const MAX_FREQ = 8e8

let sdr = null
let decoder = null
let player = null

export const mode = ref('FM')
export const frequency = ref(88.7 * 1e6)
export const tuningFreq = ref(0)
export const latency = ref(0)
export const signalLevel = ref(0)
export const device = ref('')
export const totalReceived = ref(0)

export async function connect() {
  sdr = await RtlSdr.requestDevice()
  device.value = sdr._usbDevice._device.productName
}

export async function disconnect() {
  const toClose = sdr
  sdr = null
  device.value = ''
  await new Promise(r => setTimeout(r, 1000 / BUFS_PER_SEC + 10))
  toClose.close()
}

let frequencyChanging = false

export async function receive() {
  decoder = decoder || new Decoder()
  decoder.setMode(mode.value)

  player = player || new Player()
  await sdr.open({ ppm: 0.5 })
  await sdr.setSampleRate(SAMPLE_RATE)
  await sdr.setCenterFrequency(frequency.value)
  await sdr.resetBuffer()
  let currentFreq = frequency.value
  while (sdr) {
    if (frequencyChanging) {
      await new Promise(r => setTimeout(r, 1))
      continue
    }

    if (currentFreq !== frequency.value) {
      currentFreq = frequency.value
      await sdr.resetBuffer()
    }
    const samples = await sdr.readSamples(SAMPLES_PER_BUF)
    if (samples.byteLength > 0) {
      postMessage({ type: 'samples', samples, ts: Date.now(), frequency: currentFreq })
    }
  }
}

watch(frequency, async newFreq => {
  try {
    frequencyChanging = true
    if (newFreq < MIN_FREQ) {
      frequency.value = MIN_FREQ
      tuningFreq.value = 0
    } else if (newFreq > MAX_FREQ) {
      frequency.value = MAX_FREQ
      tuningFreq.value = 0
    } else {
      await sdr.setCenterFrequency(newFreq)
    }
  } finally {
    frequencyChanging = false
  }
})

watch(mode, newMode => {
  decoder.setMode(newMode)
})

window.addEventListener('message', ({ data }) => {
  switch (data.type) {
    case 'samples':
      const samples = data.samples
      totalReceived.value += samples.byteLength
      let [left, right, sl] = decoder.process(samples, true, -tuningFreq.value)

      if (frequency.value === data.frequency) {
        if (sl > 0.5 && tuningFreq.value !== 0) {
          frequency.value = frequency.value + tuningFreq.value
          tuningFreq.value = 0
        } else if (tuningFreq.value > 0) {
          if (tuningFreq.value < 300000) {
            tuningFreq.value += 100000
          } else {
            frequency.value = frequency.value + tuningFreq.value
            tuningFreq.value = 100000
          }
        } else if (tuningFreq.value < 0) {
          if (tuningFreq.value > -300000) {
            tuningFreq.value -= 100000
          } else {
            frequency.value = frequency.value + tuningFreq.value
            tuningFreq.value = -100000
          }
        }
      }

      signalLevel.value = sl
      left = new Float32Array(left);
      right = new Float32Array(right);
      player.play(left, right, signalLevel.value, 0.15);
      latency.value = Date.now() - data.ts
      break;
  }
})