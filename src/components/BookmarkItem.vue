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
    <font-awesome-icon :icon="`fa-solid ${data.expand ? 'fa-folder-open' : 'fa-folder'}`" />
    {{ data.name }}
  </div>
  <div class="items" v-show="data.expand">
    <bookmark-item v-for="it in data.items" :data="it" />
  </div>
</div>
<div v-else class="item" @click="mode = data.mode, frequency = data.frequency * 1e6, tuningFreq = 0">
  <font-awesome-icon icon="fa-solid fa-radio" v-if="frequency === data.frequency * 1e6" /> {{ data.name }} {{  data.mode }} {{ data.frequency }}
</div>
</template>

<style scoped lang="scss">
.dir {
  text-align: left;

  .title {
    cursor: pointer;
    padding-top: 10px;
  }

  .items {
    padding: 0 0 0 15px;
  }
}

.item {
  text-align: left;
  margin: 10px 0;
  cursor: pointer;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>