<template>
  <article class="line-card" :class="{ idle: line.state !== 'running' }">
    <header class="lc-head">
      <div class="lc-title">
        <span class="lc-dot" :style="{ background: color }" aria-hidden="true"></span>
        <h3>{{ line.line_id }}</h3>
      </div>
      <span class="lc-state" :class="line.state === 'running' ? 'is-running' : 'is-idle'">
        <span v-if="line.live" class="live-pulse" aria-hidden="true"></span>
        {{ line.state === 'running' ? (line.live ? 'Live' : 'Running') : 'Idle' }}
      </span>
    </header>

    <div class="lc-product">
      <template v-if="line.product">
        <span class="lc-product-name">{{ line.product }}</span>
        <span class="lc-product-meta">{{ line.type }}<template v-if="line.destination"> · → {{ line.destination }}</template></span>
      </template>
      <span v-else class="lc-noproduct">No product assigned</span>
    </div>

    <div class="lc-metric">
      <div class="lc-kg">
        <span class="lc-kg-value">{{ line.fish_kg.toLocaleString('en-US') }}</span>
        <span class="lc-kg-unit">kg</span>
      </div>
      <div class="lc-spark" v-if="hasSpark">
        <apexchart type="area" height="42" width="110" :options="sparkOptions" :series="sparkSeries" />
      </div>
    </div>

    <div class="lc-share">
      <div class="lc-share-track">
        <div class="lc-share-fill" :style="{ width: sharePct + '%', background: color }"></div>
      </div>
      <span class="lc-share-label">{{ sharePct }}% of top line</span>
    </div>

    <footer class="lc-foot">
      <span class="lc-stat"><AppIcon name="box" :size="14" />{{ line.tote_count }} totes</span>
      <span class="lc-stat" v-if="line.avg_temp !== null"><AppIcon name="thermometer" :size="14" />{{ line.avg_temp }}°C</span>
      <span class="lc-stat lc-time"><AppIcon name="clock" :size="14" />{{ lastActivity }}</span>
    </footer>
  </article>
</template>

<script>
import AppIcon from '@/components/icons/AppIcon.vue'

export default {
  name: 'LineCard',
  components: { AppIcon },
  props: {
    line: { type: Object, required: true },
    color: { type: String, default: 'var(--viz-1)' },
    maxKg: { type: Number, default: 0 },
    spark: { type: Array, default: () => [] }
  },
  computed: {
    sharePct() {
      if (!this.maxKg) return 0
      return Math.round((this.line.fish_kg / this.maxKg) * 100)
    },
    hasSpark() {
      return this.spark && this.spark.some(v => v > 0)
    },
    sparkSeries() {
      return [{ name: this.line.line_id, data: this.spark }]
    },
    sparkOptions() {
      return {
        chart: { sparkline: { enabled: true }, animations: { enabled: false } },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
        colors: [this.color],
        tooltip: { enabled: false },
      }
    },
    lastActivity() {
      if (!this.line.last_activity) return 'no activity'
      const diff = Date.now() - new Date(this.line.last_activity).getTime()
      const mins = Math.round(diff / 60000)
      if (mins < 1) return 'just now'
      if (mins < 60) return `${mins}m ago`
      const hrs = Math.round(mins / 60)
      if (hrs < 24) return `${hrs}h ago`
      return `${Math.round(hrs / 24)}d ago`
    }
  }
}
</script>

<style scoped lang="scss">
.line-card {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--panel-shadow);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: box-shadow var(--duration-base) var(--ease-out),
              transform var(--duration-base) var(--ease-out);

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  &.idle { opacity: 0.82; }
}

.lc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lc-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  h3 {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text);
  }
}

.lc-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.lc-state {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &.is-running { background: var(--color-success-bg); color: var(--color-success); }
  &.is-idle    { background: var(--color-bg); color: var(--color-text-muted); }
}

.live-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 0 0 rgba(6, 122, 75, 0.5);
  animation: livePulse 1.8s var(--ease-out) infinite;
}

@keyframes livePulse {
  0%   { box-shadow: 0 0 0 0 rgba(6, 122, 75, 0.45); }
  70%  { box-shadow: 0 0 0 7px rgba(6, 122, 75, 0); }
  100% { box-shadow: 0 0 0 0 rgba(6, 122, 75, 0); }
}

.lc-product {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-height: 34px;

  .lc-product-name { font-weight: 600; color: var(--color-text); font-size: var(--text-base); }
  .lc-product-meta { font-size: var(--text-xs); color: var(--color-text-secondary); }
  .lc-noproduct { font-size: var(--text-sm); color: var(--color-text-muted); font-style: italic; }
}

.lc-metric {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}

.lc-kg {
  display: flex;
  align-items: baseline;
  gap: 4px;

  .lc-kg-value {
    font-family: var(--font-heading);
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  .lc-kg-unit { font-size: var(--text-base); font-weight: 600; color: var(--color-text-muted); }
}

.lc-spark { margin-bottom: 2px; }

.lc-share {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lc-share-track {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-bg);
  overflow: hidden;
}

.lc-share-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--duration-slow) var(--ease-out);
}

.lc-share-label { font-size: var(--text-xs); color: var(--color-text-muted); }

.lc-foot {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);

  .lc-stat {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;

    svg { color: var(--color-text-muted); }
  }
  .lc-time { margin-left: auto; }
}

@media (prefers-reduced-motion: reduce) {
  .live-pulse { animation: none; }
  .line-card:hover { transform: none; }
}
</style>
