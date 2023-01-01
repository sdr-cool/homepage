import { ref, watch } from 'vue'
import Player from './audio'

let ws = null
let player = null

export const mode = ref('FM')
export const frequency = ref(88.7 * 1e6)
export const tuningFreq = ref(0)
export const latency = ref(0)
export const signalLevel = ref(0)
export const device = ref('')
export const totalReceived = ref(0)

const url = 'ws://localhost:3000/data'

export async function connect() {
  player = player || new Player()
  ws = new WebSocket(url)
  ws.binaryType = "arraybuffer"
  device.value = url
  ws.addEventListener('message', ({ data }) => {
    if (data instanceof ArrayBuffer) {
      totalReceived.value += data.byteLength
      const sz = (data.byteLength - 16) / 2
      const left = new Float32Array(data.slice(0, sz))
      const right = new Float32Array(data.slice(sz, sz * 2))
      player.play(left, right, signalLevel.value, 0.15)

      const dv = new DataView(data)
      signalLevel.value = dv.getFloat64(sz * 2)
      latency.value = Date.now() - dv.getFloat64(sz * 2 + 8)
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

watch(frequency, async newFreq => {
  // await sdr.setCenterFrequency(newFreq)
})

watch(mode, newMode => {
  // decoder.setMode(newMode)
})
