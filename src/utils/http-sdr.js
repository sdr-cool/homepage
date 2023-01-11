import { watch } from 'vue'
import { proto } from '@sdr.cool/utils'
import { getInstance } from './player'
import { mode, frequency, tuningFreq, latency, device, totalReceived, setSignalLevel } from './sdr-vals'

let ws = null
let player = null
let error = null

const url = import.meta.env.PROD ? `ws://${location.host}/data` : `ws://${location.hostname}:3000/data`
// const url = 'ws://6.6.6.6/data'

export async function connect() {
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
      const { left, right, signalLevel } = proto.decode(new Uint8Array(data))

      setSignalLevel(signalLevel)
      player.play(left, right)
    } else {
      const info = JSON.parse(data)
      tsOffset = Math.round(info.ts - (connTs + Date.now()) / 2 + (Date.now() - connTs) / 2)
      device.value = `${url} ${(Date.now() - connTs) / 2}ms`
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

watch(tuningFreq, () => {
  ws.send(JSON.stringify({ type: 'frequency', frequency: frequency.value, tuningFreq: tuningFreq.value  }))
})

watch(mode, newMode => {
  ws.send(JSON.stringify({ type: 'mode', mode: newMode  }))
})