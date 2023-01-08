// white-noise-processor.js
class WhiteNoiseProcessor extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args)

    this.left = []
    this.right = []
    this.cur = 0

    this.port.onmessage = ({ data: [left, right] }) => {
      if (this.left.length > 3) {
        this.left = [left]
        this.right = [right]
        this.cur = 0
        console.log('c')
      } else {
        this.left.push(left)
        this.right.push(right)
      }
    }
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

  process(inputs, outputs, parameters) {
    if (this.left.length > 0) {
      const [left, right] = outputs[0]
      this.fill(left, this.left)
      const block0end = this.fill(right, this.right)
      this.cur += left.length
      if (block0end) {
        this.left.shift()
        this.right.shift()
        this.cur = this.left.length > 0 ? this.cur - this.left[0].length : 0
      }
    }
    return true;
  }
}

registerProcessor("sdr-worklet", WhiteNoiseProcessor);