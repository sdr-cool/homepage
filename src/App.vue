<script setup>
import { ref } from 'vue'
import { connect as connectSdr, disconnect, receive, device, frequency, signalLevel, totalReceived, processedData } from  './utils/sdr'

const error = ref(null)

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
</script>

<template>
<div class="panel">
  <div class="left">
    <button>asdf</button>
  </div>
  <div class="cennter_console">
    <div v-if="!error" class="radio_info">
      <div class="freq">{{ (frequency / 1e6).toFixed(1) }}</div>
      <div class="mode">FM</div>
      <div class="signal_level">
        <div class="bar" :style="{ height: signalLevel * 100 + '%'  }"></div>
      </div>
    </div>
  </div>
  <div class="right">
    <button>asdf</button>
  </div>
  <div class="bottom">
    <button @click="connect" v-if="!device">连接</button>
    <button @click="disconnect" v-if="device">断开</button>
  </div>
</div>

<p v-if="error">
  <pre v-if="!error.stack">{{ error }}</pre>
  <pre v-if="error.stack">{{ error.stack }}</pre>
</p>
</template>

<style scoped lang="scss">
.panel {
  border-radius: 5px;
  box-shadow: 1px 1px 3px 3px #888;
  padding: 10px;
  display: flex;
  background-color: #dddddd;
  flex-wrap: wrap;

  .bottom {
    width: 100%;
  }
  
  .cennter_console {
    color: #bdfcdf;
    background-color: #364334;
    flex-grow: 2;
    // min-width: 220px;
    height: 80px;

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
