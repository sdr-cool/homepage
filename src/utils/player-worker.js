import decoder from '@sdr.cool/demodulator-wasm'
import { RingBuffer } from '@sdr.cool/utils'

class SdrProcessor extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args)

    this.left = []
    this.right = []
    this.cur = 0

    this.buffer = new RingBuffer(2400, 2)

    this.port.onmessage = ({ data: { type, mode, raw, tuningFreq, left, right } }) => {
      if (type === 'set_mode') {
        return decoder.setMode(mode)
      }

      if (raw) {
        const [dl, dr, signalLevel ] = decoder.demodulate(raw, -tuningFreq)
        this.port.postMessage(signalLevel)
        left = new Float32Array(dl)
        right = new Float32Array(dr)
      }

      this.buffer.push([left, right])
    }
  }

  process(inputs, outputs) {
    this.buffer.pull(outputs[0])
    return true
  }
}

registerProcessor('sdr-worklet', SdrProcessor)