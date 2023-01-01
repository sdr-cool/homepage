import { watch } from 'vue'
import Player from './audio'
import { mode, frequency, tuningFreq, latency, signalLevel, device, totalReceived } from './sdr-vals'

let ws = null
let player = null

const url = 'ws://localhost:3000/data'

export async function connect() {
  player = player || new Player()
  ws = new WebSocket(url)
  ws.binaryType = "arraybuffer"
  device.value = url
  ws.addEventListener('message', ({ data }) => {
    if (data instanceof ArrayBuffer) {
      totalReceived.value += data.byteLength
      const sz = (data.byteLength - 16 - 4) / 2
      const left = new Float32Array(data.slice(0, sz))
      const right = new Float32Array(data.slice(sz, sz * 2))
      player.play(left, right, signalLevel.value, 0.15)

      const dv = new DataView(data)
      signalLevel.value = dv.getFloat64(sz * 2)
      latency.value = Date.now() - dv.getFloat64(sz * 2 + 8)
      const freqR = dv.getUint32(sz * 2 + 16)
    } else {
      const info = JSON.parse(data)
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
