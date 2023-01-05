import { watch } from 'vue'
import { getInstance } from './audio'
import Decoder from './decode-worker'
import { mode, frequency, tuningFreq, latency, device, totalReceived, setSignalLevel } from './sdr-vals'

let ws = null
let player = null
let decoder = null
let error = null

const url = import.meta.env.PROD ? `ws://${location.host}/data` : `ws://${location.hostname}:3000/data`

export async function connect() {
  decoder = decoder || new Decoder()
  player = getInstance()
  error = null
  ws = new WebSocket(url)
  ws.binaryType = "arraybuffer"
  device.value = url
  let connTs = 0
  let tsOffset = 0

  ws.addEventListener('open', () => {
    connTs = Date.now()
    ws.send(JSON.stringify({ type: 'init' }))
  })

  ws.addEventListener('error', () => error = `Connect to ${url} failed.`)
  ws.addEventListener('close', () => error = `Stream ${url} closed.`)

  ws.addEventListener('message', ({ data }) => {
    if (data instanceof ArrayBuffer) {
      totalReceived.value += data.byteLength
      if (connTs === 0 || Date.now() - connTs < 1000) return

      const sz = data.byteLength - 8 - 4
      const samples = data.slice(0, sz)

      let [left, right, sl] = decoder.process(samples, true, -tuningFreq.value)
      left = new Float32Array(left);
      right = new Float32Array(right);
      player.play(left, right, sl, mode.value === 'FM' ? 0.15 : sl / 10);
      setSignalLevel(sl)

      const dv = new DataView(data)
      const ts = dv.getFloat64(sz)
      const freqR = dv.getUint32(sz + 8)
      latency.value = Date.now() - ts + tsOffset

      if (frequency.value === freqR) {
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
    } else {
      const info = JSON.parse(data)
      tsOffset = Math.round(info.ts - (connTs + Date.now()) / 2 + (Date.now() - connTs) / 2)
      mode.value = info.mode
      frequency.value = info.frequency
      tuningFreq.value = info.tuningFreq
    }
  })
}

export async function disconnect() {
  const toClose = ws
  ws = null
  device.value = ''

  await new Promise(r => setTimeout(r, 100))
  if (toClose) toClose.close()
}

export async function receive() {
  while (ws) {
    await new Promise(r => setTimeout(r, 100))
    if (error) throw error
  }
}

watch(frequency, () => {
  ws.send(JSON.stringify({ type: 'frequency', frequency: frequency.value, tuningFreq: tuningFreq.value  }))
})

// watch(tuningFreq, () => {
//   ws.send(JSON.stringify({ type: 'frequency', frequency: frequency.value, tuningFreq: tuningFreq.value  }))
// })

watch(mode, newMode => {
  ws.send(JSON.stringify({ type: 'mode', mode: newMode  }))
})
