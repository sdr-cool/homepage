import { decoder, RingBuffer } from '@sdr.cool/utils'

class SdrProcessor extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args)

    this.left = []
    this.right = []
    this.cur = 0

    this.buffer = new RingBuffer(4096, 2)

    this.port.onmessage = ({ data: { type, mode, raw, frequency, tuningFreq, left, right } }) => {
      if (type === 'set_mode') {
        return decoder.setMode(mode)
      }

      if (raw) {
        const [dl, dr, signalLevel, tuning] = decoder.decode(raw, frequency, tuningFreq)
        this.port.postMessage([signalLevel, tuning])
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