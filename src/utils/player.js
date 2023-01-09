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

    const bufferSize = 2048
    const sp = this._ac.createScriptProcessor(bufferSize, 1, 2)
    sp.onaudioprocess = ({ outputBuffer }) => {
      if (this.left.length > 0) {
        const left = outputBuffer.getChannelData(0)
        const right = outputBuffer.getChannelData(1)

        this.fill(left, this.left)
        const blockRaed = this.fill(right, this.right)
        this.cur += left.length
        if (blockRaed > 0) {
          this.left = this.left.slice(blockRaed)
          this.right = this.right.slice(blockRaed)
          this.cur = this.left.length > 0 ? this.cur - blockRaed * this.left[0].length : 0
        }
      }
    }

    const oscillator = ac.createOscillator();
    oscillator.connect(sp);
    sp.connect(ac.destination);
  }

  fill(out, src) {
    let read = 0, i = 0
    for (; read < out.length && i < src.length; i++) {
      const sub = src[i].subarray(this.cur + read - i * src[0].length, this.cur - i * src[0].length + out.length)
      out.set(sub, read)
      read += sub.length
    }

    return src[0].length * i > this.cur + read ? i - 1 : i
  }

  play(left, right) {
    if (this.left.length > 5) {
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