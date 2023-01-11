import { AUDIO_SAMPLE_RATE } from './sdr-vals'
import sdrWorklet from './player-worker.js?url&worker'

class Player {
  constructor() {
    const ac = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: AUDIO_SAMPLE_RATE })
    ac.audioWorklet.addModule(sdrWorklet).then(() => {
      const sdr = new AudioWorkletNode(ac, 'sdr-worklet', { outputChannelCount: [2] })
      sdr.connect(ac.destination)
      this._ac = ac
      this._port = sdr.port

      this._port.onmessage = function () {}
    });
  }

  play(left, right, level, squelch) {
    this._port.postMessage({ type: 'audio', left, right })
  }

  setMode(mode) {
    this._port.postMessage({ type: 'set_mode', mode })
  }

  playRaw(raw, frequency, tuningFreq) {
    this._port.postMessage({ type: 'raw', raw, frequency, tuningFreq })
    return new Promise(r => this._port.addEventListener('message', ({ data }) => r(data), { once: true }))
  }
}


let instance = null
export function init() {
  if (!instance) {
    instance = new Player()
  }
}

export { Player }