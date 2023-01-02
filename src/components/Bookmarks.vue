<script setup>
import axios from 'axios'
import { ref } from 'vue'

import BookmarkItem from './BookmarkItem.vue'

const presets = ref([])
axios.get('/presets/zh-cn.json').then(({ data }) => presets.value = data)
</script>

<template>
<div class="bookmark">
  <bookmark-item v-for="d in presets" :data="d" />
</div>
</template>

<style scoped lang="scss">
.bookmark {
  margin: 10px auto;
  min-width: 200px;
  padding: 10px;
  background-color: #eee;
}
</style>