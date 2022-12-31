import RtlSdr from 'rtlsdrjs'

class Sdr {
  constructor() {
  }

  async connect() {
    self._sdr = await RtlSdr.requestDevice()
  }

  get device() {
    return self._sdr._usbDevice._device.productName
  }
}

export default Sdr;