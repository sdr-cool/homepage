<script setup>
import { mode, frequency, tuningFreq } from '../utils/sdr-vals'

const props = defineProps({
  data: {
    type: Object,
    default: null,
    required: true
  }
})
</script>

<template>
<div v-if="data.type === 'dir'" class="dir">
  <div @click="data.expand = !data.expand" class="title">
    <span v-show="!data.expand">▸</span>
    <span v-show="data.expand">▾</span>
    {{ data.name }}
  </div>
  <div class="items" v-show="data.expand">
    <bookmark-item v-for="it in data.items" :data="it" />
  </div>
</div>
<div v-else class="item" @click="mode = data.mode, frequency = data.frequency * 1e6, tuningFreq = 0">
  {{ data.name }} {{  data.mode }} {{ data.frequency }}
</div>
</template>

<style scoped lang="scss">
.dir {
  text-align: left;

  .title {
    cursor: pointer;
  }

  .items {
    padding: 0 0 0 15px;
  }
}

.item {
  text-align: left;
  margin: 5px 0;
  cursor: pointer;
}
</style>