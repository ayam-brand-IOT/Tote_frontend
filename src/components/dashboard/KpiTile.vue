<template>
  <div class="kpi-tile">
    <div class="kpi-top">
      <span class="kpi-icon" :style="{ color: accent, background: accentSoft }">
        <AppIcon :name="icon" :size="18" />
      </span>
      <span
        v-if="delta !== null && delta !== undefined"
        class="kpi-delta"
        :class="deltaClass"
      >
        <AppIcon :name="delta >= 0 ? 'trending-up' : 'trending-down'" :size="13" />
        {{ Math.abs(delta) }}%
      </span>
    </div>

    <div class="kpi-value">
      <span class="kpi-number">{{ display }}</span>
      <span v-if="unit" class="kpi-unit">{{ unit }}</span>
    </div>
    <div class="kpi-label">{{ label }}</div>
    <div v-if="sub" class="kpi-sub">{{ sub }}</div>
  </div>
</template>

<script>
import AppIcon from '@/components/icons/AppIcon.vue'

export default {
  name: 'KpiTile',
  components: { AppIcon },
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], required: true },
    unit: { type: String, default: '' },
    icon: { type: String, default: 'activity' },
    accent: { type: String, default: 'var(--color-brand)' },
    accentSoft: { type: String, default: 'var(--color-brand-light)' },
    delta: { type: Number, default: null },
    sub: { type: String, default: '' },
    format: { type: Boolean, default: true }
  },
  computed: {
    display() {
      if (typeof this.value === 'number' && this.format) {
        return this.value.toLocaleString('en-US')
      }
      return this.value
    },
    deltaClass() {
      if (this.delta > 0) return 'delta-up'
      if (this.delta < 0) return 'delta-down'
      return 'delta-flat'
    }
  }
}
</script>

<style scoped lang="scss">
.kpi-tile {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--panel-shadow);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.kpi-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
}

.kpi-delta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  font-variant-numeric: tabular-nums;

  &.delta-up   { color: var(--color-success); background: var(--color-success-bg); }
  &.delta-down { color: var(--color-danger);  background: var(--color-danger-bg); }
  &.delta-flat { color: var(--color-text-muted); background: var(--color-bg); }
}

.kpi-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.kpi-number {
  font-family: var(--font-heading);
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.kpi-unit {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-muted);
}

.kpi-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.kpi-sub {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
