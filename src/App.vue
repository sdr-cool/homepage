<script setup>
import { ref } from 'vue'
import { mode, frequency, tuningFreq, latency, signalLevel, device, totalReceived } from './utils/sdr-vals'
import ModeSelect from './components/ModeSelect.vue'
import FrequencyInput from './components/FrequencyInput.vue'
import Bookmarks from './components/Bookmarks.vue'
import { init as initPlayer } from './utils/player'

let connect, disconnect, receive

const error = ref(null)
const debug = ref(false)
const showModeSelect = ref(false)
const showFreqInput = ref(false)
const showBookmarks = ref(false)

async function connectSdr() {
  initPlayer()
  const module = import.meta.env.VITE_SDR_PROXY ? await import('./utils/http-sdr.js') : await import('./utils/sdr.js')
  connect = module.connect
  disconnect = module.disconnect
  receive = module.receive

  error.value = null
  try {
    await connect()
    await receive()
  } catch (e) {
    error.value = e.message || e.toString()
    console.error(e)
    disconnect()
  }
}

function size(sz) {
  sz /= 1024 * 1024
  if (sz > 1024) {
    sz /= 1024
    return `${sz.toFixed(3)}GB`
  } else {
    return `${sz.toFixed(1)}MB`
  }
}
</script>

<template>
<div class="panel">
  <div class="left">
    <button :disabled="!device" @click="frequency -= 100000">‹</button>
    <button :disabled="!device" @click="tuningFreq -= 100000">«</button>
  </div>
  <div class="cennter_console">
    <div v-if="!error && device" class="radio_info">
      <div class="freq" @click="showFreqInput = !showFreqInput">{{ ((frequency + tuningFreq) / 1e6).toFixed(2) }}</div>
      <div class="info">
        <div class="signal_level">
          <div class="bar" :style="{ height: signalLevel * 100 + '%'  }"></div>
        </div>
        <div class="mode" @click="showModeSelect = !showModeSelect">{{ mode }}</div>
      </div>
    </div>
    <div v-if="error" class="error">
      ERROR
    </div>
  </div>
  <div class="right">
    <button :disabled="!device" @click="frequency += 100000">›</button>
    <button :disabled="!device" @click="tuningFreq += 100000">»</button>
  </div>
  <mode-select v-model="showModeSelect" />
  <frequency-input v-model="showFreqInput" />
  <div class="bottom">
    <div>
      <button @click="connectSdr" v-if="!device">⏼</button>
      <button @click="disconnect" v-if="device" class="active">⏼</button>
    </div>
    <div class="center">
      {{ device }}
    </div>
    <div>
      <button style="font-size: 14px" v-if="device" @click="showBookmarks = !showBookmarks" :class="{ active: showBookmarks }">☆</button>
    </div>
  </div>
  <bookmarks v-show="device && showBookmarks" />
  <div class="debug" v-if="debug || error">
    <div>Data: {{ size(totalReceived) }}, latency: <span class="latency">{{ latency }}</span>ms</div>
    <p v-if="error">
      <pre>{{ error }}</pre>
    </p>
  </div>
</div>

</template>

<style scoped lang="scss">
.panel {
  border-radius: 5px;
  // box-shadow: 1px 1px 2px 2px #ddd;
  padding: 10px 5px;
  display: flex;
  background-color: #dddddd;
  flex-wrap: wrap;

  .left, .right {
    button {
      display: block;
      width: 50px;
      height: 20px;
      line-height: 0;
      padding: 25px 0;
    }

    :first-child {
      margin-bottom: 4px;
    }
  }

  .left {
    padding-right: 5px;
  }

  .right {
    padding-left: 5px;
  }

  .bottom {
    width: 100%;
    margin-top: 15px;
    display: flex;
    align-items: center;

    .center {
      flex-grow: 1;
    }

    button {
      padding: 15px 0;
      width: 50px;

      &.active {
        background-color: #ccc;
        color: #666;
      }
    }
  }

  .debug {
    margin-top: 10px;
    width: 100%;
    background-color: #364334;
    color: #bdfcdf;
    padding: 10px 5px;

    .latency {
      min-width: 20px;
      display: inline-block;
    }

    pre {
      text-align: left;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
  
  .cennter_console {
    color: #bdfcdf;
    background-color: #364334;
    flex-grow: 2;
    // min-width: 220px;
    height: 107px;

    .error {
        line-height: 107px;
        font-size: 20px;
        font-weight: bold;
        animation: blinker 1s linear infinite;
    }

    @keyframes blinker {
      50% {
        opacity: 0;
      }
    }

    .radio_info {
      height: 100%;
      display: flex;
      place-items: center;

      .freq {
        font-size: 60px;
        font-weight: bold;
        cursor: pointer;
        margin-left: auto;
      }

      .info {
        margin-left: 5px;
        margin-right: auto;
      }

      .mode {
        font-size: 15px;
        font-weight: bold;
        cursor: pointer;
      }

      .signal_level {
        position: relative;
        height: 30px;
        width: 10px;
        background-color: #3d7457;
        margin: 0 auto;

        .bar {
          width: 100%;
          background-color: #bdfcdf;
          position: absolute;
          left: 0;
          bottom: 0;
        }
      }
    }
  } // centor_console
} // panel
</style>
