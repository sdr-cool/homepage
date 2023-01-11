import _ from 'lodash'
import { watch } from 'vue'
import { sdrLoop } from '@sdr.cool/utils'

import { getInstance } from './player'

import { error, mode, frequency, tuningFreq, latency, setSignalLevel, device, totalReceived } from './sdr-vals'

let player = null

const save = _.debounce(() => {
  localStorage.setItem('sdr_state', JSON.stringify({ mode: mode.value, frequency: frequency.value }))
}, 1000)

export async function connect() {
  try {
    const saved = JSON.parse(localStorage.getItem('sdr_state'))
    mode.value = saved.mode
    frequency.value = saved.frequency
  } catch { }

  player = getInstance()
  sdrLoop.start(processSamples, () => tuningFreq.value).catch(e => error.value = e)
  device.value = await sdrLoop.getDevice()
  player.setMode(mode.value)
}

export async function disconnect() {
  await sdrLoop.stop()
  device.value = ''
}

watch(frequency, async newFreq => {
  const freq = sdrLoop.setFrequency(newFreq)
  if (freq !== newFreq) frequency.value = freq
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