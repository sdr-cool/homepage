import _ from 'lodash'
import { ref, watch } from 'vue'

import RtlSdr from 'rtlsdrjs'
import Decoder from './decode-worker'
import Player from './audio'

import { mode, frequency, tuningFreq, latency, setSignalLevel, device, totalReceived } from './sdr-vals'

const SAMPLE_RATE = 1024 * 1e3 // Must be a multiple of 512 * BUFS_PER_SEC
const BUFS_PER_SEC = 100
const SAMPLES_PER_BUF = Math.floor(SAMPLE_RATE / BUFS_PER_SEC)
const MIN_FREQ = 5e5
const MAX_FREQ = 8e8

let sdr = null
let decoder = null
let player = null

const save = _.debounce(() => {
  localStorage.setItem('sdr_state', JSON.stringify({ mode: mode.value, frequency: frequency.value }))
}, 1000)

export async function connect() {
  sdr = await RtlSdr.requestDevice()
  device.value = sdr._usbDevice._device.productName

  try {
    const saved = JSON.parse(localStorage.getItem('sdr_state'))
    mode.value = saved.mode
    frequency.value = saved.frequency
  } catch { }
}

export async function disconnect() {
  const toClose = sdr
  sdr = null
  device.value = ''
  await new Promise(r => setTimeout(r, 1000 / BUFS_PER_SEC + 10))
  toClose.close()
}

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
    if (currentFreq !== frequency.value) {
      currentFreq = frequency.value
      await sdr.setCenterFrequency(frequency.value)
      await sdr.resetBuffer()
    }
    const samples = await sdr.readSamples(SAMPLES_PER_BUF)
    if (samples.byteLength > 0) {
      postMessage({ type: 'samples', samples, ts: Date.now(), frequency: currentFreq })
    }
  }
}

watch(frequency, async newFreq => {
  if (newFreq < MIN_FREQ) {
    frequency.value = MIN_FREQ
    tuningFreq.value = 0
  } else if (newFreq > MAX_FREQ) {
    frequency.value = MAX_FREQ
    tuningFreq.value = 0
  }
  save()
})

watch(mode, newMode => {
  decoder.setMode(newMode)
  save()
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

      setSignalLevel(sl)
      left = new Float32Array(left);
      right = new Float32Array(right);
      player.play(left, right, sl, 0.15);
      latency.value = Date.now() - data.ts
      break;
  }
})