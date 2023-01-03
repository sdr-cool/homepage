import { watch } from 'vue'
import Player from './audio'
import { mode, frequency, tuningFreq, latency, device, totalReceived, setSignalLevel } from './sdr-vals'

let ws = null
let player = null

// const url = 'ws://192.168.1.18:3000/data'
const url = `ws://${location.host}/data`

export async function connect() {
  player = player || new Player()
  ws = new WebSocket(url)
  ws.binaryType = "arraybuffer"
  device.value = url
  let connTs = 0
  let tsOffset = 0

  ws.addEventListener('open', () => {
    connTs = Date.now()
    ws.send(JSON.stringify({ type: 'init' }))
  })

  ws.addEventListener('message', ({ data }) => {
    if (data instanceof ArrayBuffer) {
      totalReceived.value += data.byteLength
      const sz = (data.byteLength - 16 - 4) / 2

      const dv = new DataView(data)
      const sl = dv.getFloat64(sz * 2)
      setSignalLevel(sl)

      const left = new Float32Array(data, 0, sz / 4)
      const right = new Float32Array(data, sz, sz / 4)
      if (Date.now() - connTs > 1000) player.play(left, right, sl, 0.15)

      latency.value = Date.now() - dv.getFloat64(sz * 2 + 8) + tsOffset
      const freqR = dv.getUint32(sz * 2 + 16)

      if (frequency.value + tuningFreq.value === freqR) {
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
  ws.close()
  ws = null
  device.value = ''
}

export async function receive() { }

watch(frequency, () => {
  ws.send(JSON.stringify({ type: 'frequency', frequency: frequency.value, tuningFreq: tuningFreq.value  }))
})

watch(tuningFreq, () => {
  ws.send(JSON.stringify({ type: 'frequency', frequency: frequency.value, tuningFreq: tuningFreq.value  }))
})

watch(mode, newMode => {
  ws.send(JSON.stringify({ type: 'mode', mode: newMode  }))
})
