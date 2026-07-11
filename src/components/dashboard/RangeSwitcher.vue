<template>
  <div class="range-switcher" role="tablist" aria-label="Time range">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="range-option"
      :class="{ active: modelValue === opt.value }"
      role="tab"
      :aria-selected="modelValue === opt.value"
      type="button"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'RangeSwitcher',
  props: {
    modelValue: { type: String, default: 'today' }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      options: [
        { value: 'today', label: 'Today' },
        { value: '7d', label: '7 days' },
        { value: '30d', label: '30 days' },
      ]
    }
  }
}
</script>

<style scoped lang="scss">
.range-switcher {
  display: inline-flex;
  padding: 3px;
  background: var(--color-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-md);
  gap: 2px;
}

.range-option {
  border: none;
  background: transparent;
  padding: 0.4rem 0.9rem;
  border-radius: calc(var(--radius-md) - 3px);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--duration-base) var(--ease-out),
              background-color var(--duration-base) var(--ease-out);
  white-space: nowrap;

  &:hover:not(.active) { color: var(--color-text); }

  &.active {
    background: var(--color-surface);
    color: var(--color-brand);
    box-shadow: var(--shadow-sm);
  }

  &:active { transform: scale(0.97); }
}
</style>
