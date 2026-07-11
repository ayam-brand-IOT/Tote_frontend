<template>
  <div class="page dashboard">
    <!-- Header -->
    <div class="dash-header">
      <div class="dash-title">
        <h1>Production Overview</h1>
        <p class="dash-sub">
          <span class="live-chip" :class="{ on: liveConnected && range === 'today' }">
            <span class="live-dot"></span>{{ liveConnected && range === 'today' ? 'Live' : 'Snapshot' }}
          </span>
          <span class="dash-updated">Updated {{ updatedLabel }}</span>
        </p>
      </div>
      <div class="dash-controls">
        <RangeSwitcher v-model="range" />
        <button class="btn btn-outline btn-sm refresh-btn" :class="{ spinning: loading }" @click="fetchData" :disabled="loading" aria-label="Refresh data">
          <AppIcon name="refresh" :size="16" />
          <span class="refresh-text">Refresh</span>
        </button>
      </div>
    </div>

    <Transition name="banner">
      <div v-if="error" class="banner banner-error"><AppIcon name="alert-circle" :size="20" />{{ error }}</div>
    </Transition>

    <!-- First load -->
    <EmptyState v-if="loading && !data" loading message="Loading production data..." />

    <!-- No data -->
    <EmptyState
      v-else-if="data && data.summary.total_totes === 0"
      icon="activity"
      title="No production recorded yet"
      message="Run the demo seed in the backend (npm run seed) or start processing totes to populate the dashboard." />

    <template v-else-if="data">
      <!-- KPI strip -->
      <section class="kpi-strip">
        <KpiTile
          label="Fish processed" :value="data.summary.total_fish_kg" unit="kg"
          icon="weight" accent="#c8102e" accentSoft="#fdecee"
          :delta="data.summary.fish_kg_delta_pct" :sub="rangeSubLabel" />
        <KpiTile
          label="Totes processed" :value="data.summary.total_totes"
          icon="box" accent="#2563eb" accentSoft="#e8f0fe"
          :delta="data.summary.totes_delta_pct" :sub="avgPerToteLabel" />
        <KpiTile
          label="Lines running" :value="runningLabel" :format="false"
          icon="factory" accent="#0d9488" accentSoft="#e6f4f2"
          :sub="`${data.summary.active_lines} of ${data.summary.total_lines} lines active`" />
        <KpiTile
          label="Avg out temp" :value="tempValue" :unit="data.summary.avg_temp !== null ? '°C' : ''" :format="false"
          icon="thermometer" accent="#0891b2" accentSoft="#e4f3f7"
          sub="Cold-chain target ≤ 4°C" />
      </section>

      <!-- Analytics: throughput + status -->
      <section class="analytics-grid">
        <div class="panel panel-throughput">
          <div class="panel-head">
            <div>
              <h2><AppIcon name="activity" :size="18" />Throughput by line</h2>
              <p class="panel-sub">{{ throughputSub }}</p>
            </div>
          </div>
          <apexchart type="area" height="300" :options="throughputOptions" :series="throughputSeries" />
        </div>

        <div class="panel panel-status">
          <div class="panel-head">
            <h2><AppIcon name="box" :size="18" />Tote status</h2>
          </div>
          <div v-if="statusSeries.length" class="status-chart">
            <apexchart type="donut" height="240" :options="statusOptions" :series="statusSeries" />
          </div>
          <EmptyState v-else icon="box" message="No totes in this range." compact />
        </div>
      </section>

      <!-- Line board: the focus -->
      <section class="line-board">
        <div class="board-head">
          <h2><AppIcon name="factory" :size="20" />Production lines</h2>
          <span class="board-count">{{ sortedLines.length }} lines · sorted by output</span>
        </div>
        <div class="line-grid">
          <LineCard
            v-for="line in sortedLines"
            :key="line.line_id"
            :line="line"
            :color="colorForLine(line.line_id)"
            :max-kg="maxLineKg"
            :spark="sparkFor(line.line_id)" />
        </div>
      </section>

      <!-- Secondary: comparison + products -->
      <section class="analytics-grid analytics-grid-bottom">
        <div class="panel">
          <div class="panel-head">
            <h2><AppIcon name="gauge" :size="18" />Output by line</h2>
          </div>
          <apexchart type="bar" height="260" :options="barOptions" :series="barSeries" />
        </div>

        <div class="panel">
          <div class="panel-head">
            <h2><AppIcon name="fish" :size="18" />Top products</h2>
          </div>
          <ul v-if="data.top_products.length" class="product-list">
            <li v-for="(p, i) in data.top_products" :key="i" class="product-row">
              <div class="product-info">
                <span class="product-name">{{ p.product }}</span>
                <span class="product-type">{{ p.type }} · {{ p.tote_count }} totes</span>
              </div>
              <div class="product-bar-wrap">
                <div class="product-bar-track">
                  <div class="product-bar-fill" :style="{ width: productPct(p) + '%' }"></div>
                </div>
                <span class="product-kg">{{ p.fish_kg.toLocaleString('en-US') }} kg</span>
              </div>
            </li>
          </ul>
          <EmptyState v-else icon="fish" message="No product output in this range." compact />
        </div>
      </section>

      <!-- Traceability footer -->
      <router-link to="/totes" class="trace-link">
        <span class="trace-icon"><AppIcon name="box" :size="18" /></span>
        <span class="trace-text">
          <strong>Tote traceability</strong>
          <span>Every tote above is recorded individually for cold-chain audit — open the tote log.</span>
        </span>
        <AppIcon name="chevron-right" :size="18" class="trace-arrow" />
      </router-link>
    </template>
  </div>
</template>

<script>
import RangeSwitcher from '@/components/dashboard/RangeSwitcher.vue'
import KpiTile from '@/components/dashboard/KpiTile.vue'
import LineCard from '@/components/dashboard/LineCard.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import { colorForLine, STATUS_COLORS, STATUS_LABELS } from '@/constants/chartColors'

export default {
  name: 'DashboardView',
  components: { RangeSwitcher, KpiTile, LineCard, AppIcon, EmptyState },
  data() {
    return {
      range: 'today',
      data: null,
      loading: false,
      error: null,
      ws: null,
      wsReconnectTimer: null,
      pollTimer: null,
      refetchTimer: null,
      liveConnected: false,
      updatedAt: null,
    }
  },
  computed: {
    sortedLines() {
      if (!this.data) return []
      return [...this.data.lines].sort((a, b) => {
        // Running lines first, then by output.
        if ((b.state === 'running') !== (a.state === 'running')) return a.state === 'running' ? -1 : 1
        return b.fish_kg - a.fish_kg
      })
    },
    maxLineKg() {
      if (!this.data) return 0
      return Math.max(1, ...this.data.lines.map(l => l.fish_kg))
    },
    runningLabel() {
      return this.data ? `${this.data.summary.active_lines}/${this.data.summary.total_lines}` : '0/0'
    },
    tempValue() {
      return this.data && this.data.summary.avg_temp !== null ? this.data.summary.avg_temp : '—'
    },
    rangeSubLabel() {
      return { today: 'Today so far', '7d': 'Last 7 days', '30d': 'Last 30 days' }[this.range]
    },
    avgPerToteLabel() {
      if (!this.data || !this.data.summary.total_totes) return '—'
      const avg = Math.round(this.data.summary.total_fish_kg / this.data.summary.total_totes)
      return `${avg} kg avg / tote`
    },
    updatedLabel() {
      if (!this.updatedAt) return '—'
      return new Date(this.updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    },
    throughputSub() {
      const total = this.data ? this.data.summary.total_fish_kg.toLocaleString('en-US') : '0'
      return `${total} kg total · ${this.data && this.data.timeseries.bucket === 'hour' ? 'hourly' : 'daily'}`
    },

    // ── Throughput (stacked area over time) ──────────────────────────────
    throughputSeries() {
      if (!this.data) return []
      return this.data.timeseries.series.map(s => ({ name: s.name, data: s.data }))
    },
    throughputOptions() {
      const cats = this.data ? this.data.timeseries.categories.map(this.formatBucket) : []
      const colors = this.throughputSeries.map(s => colorForLine(s.name))
      return {
        chart: { stacked: true, toolbar: { show: false }, fontFamily: 'inherit',
          animations: { enabled: true, easing: 'easeout', speed: 400 } },
        colors,
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.5, opacityTo: 0.05 } },
        grid: { borderColor: '#eceff4', strokeDashArray: 4, padding: { left: 4, right: 4 } },
        legend: { position: 'top', horizontalAlign: 'left', fontSize: '13px', markers: { radius: 4 }, itemMargin: { horizontal: 8 } },
        xaxis: {
          categories: cats,
          tickAmount: Math.min(cats.length, 8),
          axisBorder: { show: false }, axisTicks: { show: false },
          labels: { style: { colors: '#8891a5', fontSize: '11px' }, rotate: 0, hideOverlappingLabels: true },
        },
        yaxis: { labels: { style: { colors: '#8891a5', fontSize: '11px' }, formatter: v => Math.round(v) + ' kg' } },
        tooltip: { shared: true, intersect: false, y: { formatter: v => `${Math.round(v)} kg` } },
      }
    },

    // ── Status donut ─────────────────────────────────────────────────────
    statusSeries() {
      return this.data ? this.data.status_breakdown.map(s => s.count) : []
    },
    statusOptions() {
      const rows = this.data ? this.data.status_breakdown : []
      return {
        chart: { fontFamily: 'inherit' },
        labels: rows.map(s => STATUS_LABELS[s.status] || s.status),
        colors: rows.map(s => STATUS_COLORS[s.status] || '#8891a5'),
        legend: { position: 'bottom', fontSize: '12px', markers: { radius: 4 }, itemMargin: { horizontal: 6, vertical: 2 } },
        dataLabels: { enabled: false },
        stroke: { width: 2, colors: ['#fff'] },
        plotOptions: { pie: { donut: { size: '68%', labels: {
          show: true,
          total: { show: true, label: 'Totes', fontSize: '12px', color: '#56607a',
            formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) } } } } },
        tooltip: { y: { formatter: v => `${v} totes` } },
      }
    },

    // ── Output by line (horizontal bar) ──────────────────────────────────
    barSeries() {
      return [{ name: 'Fish processed', data: this.sortedLines.map(l => l.fish_kg) }]
    },
    barOptions() {
      const lines = this.sortedLines
      return {
        chart: { toolbar: { show: false }, fontFamily: 'inherit', animations: { easing: 'easeout', speed: 400 } },
        colors: lines.map(l => colorForLine(l.line_id)),
        plotOptions: { bar: { horizontal: true, borderRadius: 5, distributed: true, barHeight: '62%' } },
        dataLabels: { enabled: true, formatter: v => `${v.toLocaleString('en-US')} kg`,
          style: { fontSize: '11px', colors: ['#fff'], fontWeight: 600 }, offsetX: 0 },
        legend: { show: false },
        grid: { borderColor: '#eceff4', strokeDashArray: 4 },
        xaxis: { categories: lines.map(l => l.line_id),
          labels: { style: { colors: '#8891a5', fontSize: '11px' }, formatter: v => Math.round(v) },
          axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: '#0f172a', fontSize: '12px', fontWeight: 600 } } },
        tooltip: { y: { formatter: v => `${v.toLocaleString('en-US')} kg` } },
      }
    },
  },
  watch: {
    range() { this.fetchData(); this.setupPolling() }
  },
  methods: {
    colorForLine,
    formatBucket(key) {
      // 'YYYY-MM-DD HH:00' (hourly) or 'YYYY-MM-DD' (daily)
      if (key.includes(' ')) return key.split(' ')[1].slice(0, 5) // HH:MM
      const d = new Date(key + 'T00:00:00')
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    },
    sparkFor(lineId) {
      if (!this.data) return []
      const s = this.data.timeseries.series.find(x => x.name === lineId)
      return s ? s.data : []
    },
    productPct(p) {
      if (!this.data || !this.data.top_products.length) return 0
      const max = Math.max(...this.data.top_products.map(x => x.fish_kg), 1)
      return Math.round((p.fish_kg / max) * 100)
    },
    async fetchData() {
      this.loading = true
      this.error = null
      try {
        const res = await fetch(`/api/analytics/dashboard?range=${this.range}`)
        if (!res.ok) throw new Error(`Error ${res.status}`)
        this.data = await res.json()
        this.updatedAt = this.data.generated_at
      } catch (err) {
        this.error = `Could not load dashboard: ${err.message}`
      } finally {
        this.loading = false
      }
    },
    scheduleRefetch() {
      // Debounce rapid WS bursts into a single refetch.
      clearTimeout(this.refetchTimer)
      this.refetchTimer = setTimeout(() => this.fetchData(), 1200)
    },
    setupPolling() {
      clearInterval(this.pollTimer)
      // Only the live "today" view auto-polls as a WS fallback.
      if (this.range === 'today') {
        this.pollTimer = setInterval(() => this.fetchData(), 30000)
      }
    },
    connectWs() {
      try {
        const proto = location.protocol === 'https:' ? 'wss' : 'ws'
        this.ws = new WebSocket(`${proto}://${location.hostname}:3001`)
        this.ws.onopen = () => { this.liveConnected = true }
        this.ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data)
            if (['tote_created', 'tote_completed', 'update'].includes(msg.type) && this.range === 'today') {
              this.scheduleRefetch()
            }
          } catch (_) { /* ignore malformed frames */ }
        }
        this.ws.onclose = () => {
          this.liveConnected = false
          clearTimeout(this.wsReconnectTimer)
          this.wsReconnectTimer = setTimeout(() => this.connectWs(), 5000)
        }
        this.ws.onerror = () => { this.ws && this.ws.close() }
      } catch (_) { this.liveConnected = false }
    },
  },
  mounted() {
    this.fetchData()
    this.setupPolling()
    this.connectWs()
  },
  beforeUnmount() {
    clearInterval(this.pollTimer)
    clearTimeout(this.refetchTimer)
    clearTimeout(this.wsReconnectTimer)
    if (this.ws) { this.ws.onclose = null; this.ws.close() }
  }
}
</script>

<style scoped lang="scss">
.dashboard { max-width: 1440px; }

/* Header */
.dash-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
}

.dash-title h1 { font-size: var(--text-3xl); letter-spacing: -0.01em; }

.dash-sub {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.live-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: var(--color-bg);

  .live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-text-muted); }

  &.on {
    color: var(--color-success);
    background: var(--color-success-bg);
    .live-dot { background: var(--color-success); animation: pulse 1.8s var(--ease-out) infinite; }
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(6, 122, 75, 0.5); }
  70% { box-shadow: 0 0 0 6px rgba(6, 122, 75, 0); }
  100% { box-shadow: 0 0 0 0 rgba(6, 122, 75, 0); }
}

.dash-updated { font-size: var(--text-sm); color: var(--color-text-muted); }

.dash-controls { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }

.refresh-btn svg { transition: transform var(--duration-base) var(--ease-out); }
.refresh-btn.spinning svg { animation: spin 700ms linear infinite; }

/* KPI strip */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

/* Analytics grids */
.analytics-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.analytics-grid-bottom { grid-template-columns: 1fr 1fr; }

.panel {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--panel-shadow);
  padding: var(--space-5);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-4);

  h2 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-md);
    font-weight: 600;
    svg { color: var(--color-text-muted); }
  }
  .panel-sub { font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px; }
}

.status-chart { display: flex; justify-content: center; }

/* Line board */
.line-board { margin-bottom: var(--space-6); }

.board-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  margin-bottom: var(--space-4);

  h2 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xl);
    font-weight: 700;
    svg { color: var(--color-brand); }
  }
  .board-count { font-size: var(--text-sm); color: var(--color-text-muted); }
}

.line-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(288px, 1fr));
  gap: var(--space-4);
}

/* Stagger the line cards in on load */
.line-grid > * {
  animation: cardIn 360ms var(--ease-out) both;
}
@for $i from 1 through 8 {
  .line-grid > *:nth-child(#{$i}) { animation-delay: #{($i - 1) * 45}ms; }
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Top products list */
.product-list { list-style: none; display: flex; flex-direction: column; gap: var(--space-4); }

.product-row { display: flex; flex-direction: column; gap: 6px; }

.product-info { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); }
.product-name { font-weight: 600; font-size: var(--text-base); color: var(--color-text); }
.product-type { font-size: var(--text-xs); color: var(--color-text-muted); }

.product-bar-wrap { display: flex; align-items: center; gap: var(--space-3); }
.product-bar-track { flex: 1; height: 8px; background: var(--color-bg); border-radius: var(--radius-full); overflow: hidden; }
.product-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-dark));
  transition: width var(--duration-slow) var(--ease-out);
}
.product-kg { font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); font-variant-numeric: tabular-nums; white-space: nowrap; min-width: 72px; text-align: right; }

/* Traceability footer link */
.trace-link {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--color-surface);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: border-color var(--duration-base) var(--ease-out), background-color var(--duration-base) var(--ease-out);

  &:hover { border-color: var(--color-brand); background: var(--color-brand-light); }

  .trace-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; border-radius: var(--radius-md);
    background: var(--color-bg); color: var(--color-text-secondary); flex-shrink: 0;
  }
  .trace-text { display: flex; flex-direction: column; gap: 1px;
    strong { font-size: var(--text-base); color: var(--color-text); }
    span { font-size: var(--text-sm); color: var(--color-text-secondary); }
  }
  .trace-arrow { margin-left: auto; color: var(--color-text-muted); }
  &:hover .trace-arrow { color: var(--color-brand); }
}

/* Responsive */
@media (max-width: 1080px) {
  .kpi-strip { grid-template-columns: repeat(2, 1fr); }
  .analytics-grid, .analytics-grid-bottom { grid-template-columns: 1fr; }
}

@media (max-width: 560px) {
  .kpi-strip { grid-template-columns: 1fr; }
  .line-grid { grid-template-columns: 1fr; }
  .dash-title h1 { font-size: var(--text-2xl); }
}

@media (prefers-reduced-motion: reduce) {
  .line-grid > * { animation: none; }
  .live-chip.on .live-dot { animation: none; }
}
</style>
