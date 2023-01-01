<script setup>
import { ref } from 'vue'
import { connect as connectSdr, disconnect, receive, device, frequency, latency, tuningFreq, signalLevel, totalReceived, processedData } from  './utils/sdr'

const error = ref(null)
const debug = ref(false)

async function connect() {
  error.value = null
  try {
    await connectSdr()
    receive().catch(e => error.value = e)
  } catch (e) {
    error.value = e
    console.log(e.message)
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
      <div class="freq">{{ ((frequency + tuningFreq) / 1e6).toFixed(1) }}</div>
      <div class="mode">FM</div>
      <div class="signal_level">
        <div class="bar" :style="{ height: signalLevel * 100 + '%'  }"></div>
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
  <div class="bottom">
    <div>
      <button @click="connect" v-if="!device">⏼</button>
      <button @click="disconnect" v-if="device" class="active">⏼</button>
    </div>
    <div class="center">
      {{ device }}
    </div>
    <div>
      <button v-if="!debug" @click="debug = true">▼</button>
      <button v-if="debug" @click="debug = false">▶</button>
    </div>
  </div>
  <div class="debug" v-if="debug">
    <div>Data: {{ size(totalReceived) }}, latency: {{ latency }}ms</div>
    <p v-if="error">
      <pre v-if="!error.stack">{{ error }}</pre>
      <pre v-if="error.stack">{{ error.stack }}</pre>
    </p>
  </div>
</div>

</template>

<style scoped lang="scss">
.panel {
  border-radius: 5px;
  box-shadow: 1px 1px 2px 2px #ddd;
  padding: 10px 5px;
  display: flex;
  background-color: #dddddd;
  flex-wrap: wrap;

  .left, .right {
    button {
      display: block;
      width: 35px;
      height: 20px;
      line-height: 0;
      padding: 18px 0;
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
    margin-top: 10px;
    display: flex;
    align-items: center;

    .center {
      flex-grow: 1;
    }

    button {
      padding: 10px 0;
      width: 40px;

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
    height: 80px;

    .error {
        line-height: 80px;
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
      position: relative;
      .freq {
        line-height: 80px;
        font-size: 60px;
        font-weight: bold;
      }

      .mode {
        position: absolute;
        right: 10px;
        bottom: 10px;
        font-size: 15px;
        font-weight: bold;
      }

      .signal_level {
        position: absolute;
        right: 16px;
        bottom: 35px;
        height: 30px;
        width: 10px;
        background-color: #3d7457;

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
