import _ from 'lodash'
import { ref, watch } from 'vue'

import RtlSdr from '@sdr.cool/rtlsdrjs'
import { getInstance } from './player'

import { mode, frequency, tuningFreq, latency, setSignalLevel, device, totalReceived } from './sdr-vals'

const SAMPLE_RATE = 1024 * 1e3 // Must be a multiple of 512 * BUFS_PER_SEC
const BUFS_PER_SEC = 100
const SAMPLES_PER_BUF = Math.floor(SAMPLE_RATE / BUFS_PER_SEC)
const MIN_FREQ = 5e5
const MAX_FREQ = 8e8

let sdr = null
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
  if (toClose) {
    await new Promise(r => setTimeout(r, 1000 / BUFS_PER_SEC + 10))
    toClose.close()
  }
}

export async function receive() {
  player = getInstance()
  player.setMode(mode.value)

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

    const currentTuning = tuningFreq.value
    const samples = await sdr.readSamples(SAMPLES_PER_BUF)
    if (samples.byteLength > 0) {
      processSamples(samples, currentFreq, currentTuning)
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
  if (player) {
    player.setMode(newMode)
    save()
  }
})

async function processSamples(samples, f, t) {
  const start = Date.now()
  totalReceived.value += samples.byteLength

  const [sl, tuning] = await player.playRaw(samples, f, t)
  if (tuning) {
    frequency.value = tuning.frequency
    tuningFreq.value = tuning.tuningFreq
  }

  setSignalLevel(sl)
  latency.value = Date.now() - start
}