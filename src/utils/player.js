import { AUDIO_SAMPLE_RATE } from './sdr-vals'

class Player {
  constructor() {
    const ac = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: AUDIO_SAMPLE_RATE });
    ac.audioWorklet.addModule('audio-worklet.js').then(() => {
      const sdr = new AudioWorkletNode(ac, 'sdr-worklet', { outputChannelCount: [2] });
      sdr.connect(ac.destination);
      this._ac = ac;
      this._port = sdr.port;
    });
  }

  play(left, right, level, squelch) {
    this._port.postMessage([left, right]);
  }
}

class SpPlayer {
  constructor() {
    const ac = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: AUDIO_SAMPLE_RATE });
    this._ac = ac

    this.left = []
    this.right = []
    this.cur = 0

    const bufferSize = 256;
    const sp = this._ac.createScriptProcessor(bufferSize, 1, 2)
    sp.onaudioprocess = ({ outputBuffer }) => {
      if (this.left.length > 0) {
        const left = outputBuffer.getChannelData(0)
        const right = outputBuffer.getChannelData(1)

        this.fill(left, this.left)
        const block0end = this.fill(right, this.right)
        this.cur += left.length
        if (block0end) {
          this.left.shift()
          this.right.shift()
          this.cur = this.left.length > 0 ? this.cur - this.left[0].length : 0
        }
      }
    }

    const oscillator = ac.createOscillator();
    oscillator.connect(sp);
    sp.connect(ac.destination);
  }

  fill(out, src) {
    const sub = src[0].subarray(this.cur, this.cur + out.length)
    out.set(sub)
    if (sub.length < out.length) {
      if (src.length > 1) out.set(src[1].subarray(0, out.length - sub.length), sub.length)
      return true
    }

    return this.cur === src[0].length
  }

  play(left, right) {
    if (this.left.length > 3) {
      this.left = [left]
      this.right = [right]
      this.cur = 0
    } else {
      this.left.push(left)
      this.right.push(right)
    }
  }
}

let instance = null
export function init() {
  if (!instance) {
    instance = location.protocol === 'https:' ? new Player() : new SpPlayer()
  }
}

export function getInstance() { return instance }