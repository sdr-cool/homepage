import RtlSdr from 'rtlsdrjs'

async function connect() {
  return await RtlSdr.requestDevice()
}

function getDeviceName(sdr) {
  return sdr._usbDevice._device.productName
}

export { connect, getDeviceName }