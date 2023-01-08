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

let instance = null
export function init() { if (!instance) instance = new Player() }
export function getInstance() { return instance }