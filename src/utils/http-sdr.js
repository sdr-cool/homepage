import { watch } from 'vue'
import { proto } from '@sdr.cool/utils'
import { getInstance } from './player'
import { error, mode, frequency, tuningFreq, latency, device, totalReceived, setSignalLevel } from './sdr-vals'

let ws = null
let player = null
let remoteSettingInfo = false

const url = import.meta.env.PROD ? `ws://${location.host}/data` : `ws://${location.hostname}:3000/data`
// const url = 'ws://6.6.6.6/data'

function remoteSetInfo(fn) {
  remoteSettingInfo = true
  fn()
  setTimeout(() => remoteSettingInfo = false)
}

export async function connect() {
  player = getInstance()
  ws = new WebSocket(url)
  ws.binaryType = "arraybuffer"
  device.value = url
  let connTs = 0
  let tsOffset = 0

  ws.addEventListener('open', () => {
    connTs = Date.now()
    ws.send(JSON.stringify({ type: 'init' }))
  })

  ws.addEventListener('error', () => error.value = `Connect to ${url} failed.`)
  ws.addEventListener('close', () => { if (ws) error.value = `Stream ${url} closed.` })

  ws.addEventListener('message', ({ data }) => {
    if (data instanceof ArrayBuffer) {
      totalReceived.value += data.byteLength
      const { ts, left, right, signalLevel, mode: m, frequency: f, tuningFreq: t } = proto.decode(new Uint8Array(data))

      if (!left || left.length === 0) {
        remoteSetInfo(() => {
          tsOffset = Math.round(ts - (connTs + Date.now()) / 2 + (Date.now() - connTs) / 2)
          device.value = `${url} ${(Date.now() - connTs) / 2}ms`
          mode.value = m
          frequency.value = f
          tuningFreq.value = t
        })
        return
      }

      setSignalLevel(signalLevel)
      player.play(left, right)

      if (tuningFreq.value && (t || frequency.value !== f)) {
        remoteSetInfo(() => {
          frequency.value = f
          tuningFreq.value = t
        })
      }
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

watch(frequency, () => {
  if (!remoteSettingInfo) {
    ws.send(JSON.stringify({ type: 'frequency', frequency: frequency.value, tuningFreq: tuningFreq.value  }))
  }
})

watch(tuningFreq, () => {
  if (!remoteSettingInfo) {
    ws.send(JSON.stringify({ type: 'frequency', frequency: frequency.value, tuningFreq: tuningFreq.value  }))
  }
})

watch(mode, newMode => {
  ws.send(JSON.stringify({ type: 'mode', mode: newMode  }))
})