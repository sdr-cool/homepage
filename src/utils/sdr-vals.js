import _ from 'lodash'
import { ref } from 'vue'

export const AUDIO_SAMPLE_RATE = 48 * 1e3

export const mode = ref('FM')
export const frequency = ref(88.7 * 1e6)
export const tuningFreq = ref(0)
export const latency = ref(0)
export const signalLevel = ref(0)
export const device = ref('')
export const totalReceived = ref(0)

export const setSignalLevel = _.throttle(v => signalLevel.value = v, 100)