<template>
  <div class="state-block" :class="{ 'state-compact': compact }">
    <div v-if="loading" class="spinner-muted" role="status">
      <span class="visually-hidden">Loading</span>
    </div>
    <AppIcon v-else :name="icon" :size="36" />
    <div v-if="title" class="state-title">{{ title }}</div>
    <div class="state-message">{{ message }}</div>
    <slot />
  </div>
</template>

<script>
import AppIcon from './icons/AppIcon.vue'

export default {
  name: 'EmptyState',
  components: { AppIcon },
  props: {
    icon: { type: String, default: 'info' },
    title: { type: String, default: '' },
    message: { type: String, required: true },
    compact: { type: Boolean, default: false },
    loading: { type: Boolean, default: false }
  }
}
</script>
