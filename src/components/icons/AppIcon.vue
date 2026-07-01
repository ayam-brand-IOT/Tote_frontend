<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke-width="strokeWidth"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="label ? undefined : 'true'"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    v-html="markup"
  ></svg>
</template>

<script>
import { ICONS } from './icon-paths'

export default {
  name: 'AppIcon',
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 20 },
    strokeWidth: { type: [Number, String], default: 1.75 },
    label: { type: String, default: '' }
  },
  computed: {
    markup() { return ICONS[this.name] || '' }
  }
}
</script>

<style scoped>
.app-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>
