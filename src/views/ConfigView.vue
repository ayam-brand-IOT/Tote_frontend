<template>
  <div class="page config-page">
    <div class="page-header">
      <div>
        <h1><AppIcon name="settings" :size="24" />Configuration</h1>
        <p class="page-subtitle">Manage production lines, controlled values and portal users. Management only.</p>
      </div>
    </div>

    <div class="config-tabs" role="tablist">
      <button v-for="t in tabs" :key="t.key" class="config-tab" :class="{ active: activeTab === t.key }"
        role="tab" :aria-selected="activeTab === t.key" @click="activeTab = t.key">
        <AppIcon :name="t.icon" :size="16" />{{ t.label }}
      </button>
    </div>

    <!-- Export renders full-width (brings its own cards) to avoid nesting -->
    <ExportView v-if="activeTab === 'export'" embedded />

    <div v-else class="config-panel">
      <!-- Lines -->
      <section v-if="activeTab === 'lines'" class="cfg-section">
        <div class="opt-intro">
          <div>
            <h2>Production lines</h2>
            <p class="opt-desc">The physical lines on the floor. Assign products to them in the Lines view.</p>
          </div>
        </div>

        <Transition name="banner">
          <div v-if="lineError" class="banner banner-error"><AppIcon name="alert-circle" :size="18" />{{ lineError }}</div>
        </Transition>

        <form class="line-add" @submit.prevent="addLine">
          <input v-model.trim="newLine.line_id" placeholder="Line ID (e.g., Hybrid)" :disabled="lineBusy" maxlength="120" />
          <input v-model.trim="newLine.comments" placeholder="Comments (optional)" :disabled="lineBusy" maxlength="240" />
          <button type="submit" class="btn btn-primary btn-sm" :disabled="lineBusy || !newLine.line_id">
            <AppIcon name="plus" :size="16" />Add Line
          </button>
        </form>

        <EmptyState v-if="loadingLines && !lines.length" loading message="Loading lines…" compact />
        <EmptyState v-else-if="!lines.length" icon="factory" message="No lines yet." compact />
        <ul v-else class="opt-list">
          <li v-for="l in lines" :key="l.line_id" class="opt-row">
            <span class="opt-value">
              {{ l.line_id }}
              <span v-if="l.product" class="line-running">running {{ l.product }}</span>
            </span>
            <div class="opt-actions">
              <span v-if="l.comments" class="line-comment">{{ l.comments }}</span>
              <button class="icon-btn icon-btn-danger" @click="deleteLine(l)" :disabled="lineBusy" aria-label="Delete line"><AppIcon name="trash" :size="16" /></button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Controlled vocabularies -->
      <ConfigOptionList v-else-if="activeTab === 'destination'" category="destination"
        title="Destinations" placeholder="New destination (e.g., F3)"
        description="Factories/destinations chosen when linking a tote to a line." />

      <ConfigOptionList v-else-if="activeTab === 'fish_type'" category="fish_type"
        title="Fish Types" placeholder="New type (e.g., 4 (Loin))"
        description="Fish type options available when creating a product." />

      <ConfigOptionList v-else-if="activeTab === 'fish_size'" category="fish_size"
        title="Sizes" placeholder="New size (e.g., Medium Oval)"
        description="Size options available when creating a product." />

      <!-- Users -->
      <ConfigUsers v-else-if="activeTab === 'users'" />
    </div>
  </div>
</template>

<script>
import AppIcon from '@/components/icons/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfigOptionList from '@/components/config/ConfigOptionList.vue'
import ConfigUsers from '@/components/config/ConfigUsers.vue'
import ExportView from '@/views/ExportView.vue'

export default {
  name: 'ConfigView',
  components: { AppIcon, EmptyState, ConfigOptionList, ConfigUsers, ExportView },
  data() {
    return {
      activeTab: 'lines',
      tabs: [
        { key: 'lines', label: 'Lines', icon: 'factory' },
        { key: 'destination', label: 'Destinations', icon: 'arrow-up-right' },
        { key: 'fish_type', label: 'Fish Types', icon: 'fish' },
        { key: 'fish_size', label: 'Sizes', icon: 'filter' },
        { key: 'users', label: 'Users', icon: 'user' },
        { key: 'export', label: 'Export', icon: 'download' },
      ],
      lines: [],
      loadingLines: false,
      lineBusy: false,
      lineError: null,
      newLine: { line_id: '', comments: '' },
    }
  },
  methods: {
    async fetchLines() {
      this.loadingLines = true
      this.lineError = null
      try {
        const res = await fetch('/api/lines')
        if (!res.ok) throw new Error(`Error ${res.status}`)
        this.lines = (await res.json()).lines || []
      } catch (err) { this.lineError = err.message } finally { this.loadingLines = false }
    },
    async addLine() {
      if (!this.newLine.line_id) return
      this.lineBusy = true
      this.lineError = null
      try {
        const res = await fetch('/api/lines', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line_id: this.newLine.line_id, comments: this.newLine.comments || null }),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error ${res.status}`) }
        this.newLine = { line_id: '', comments: '' }
        await this.fetchLines()
      } catch (err) { this.lineError = err.message } finally { this.lineBusy = false }
    },
    async deleteLine(l) {
      if (!confirm(`Delete line "${l.line_id}"? Lines linked to totes cannot be deleted.`)) return
      this.lineBusy = true
      this.lineError = null
      try {
        const res = await fetch(`/api/lines/${l.line_id}`, { method: 'DELETE' })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error ${res.status}`) }
        await this.fetchLines()
      } catch (err) { this.lineError = err.message } finally { this.lineBusy = false }
    },
  },
  watch: {
    activeTab(tab) { if (tab === 'lines') this.fetchLines() },
  },
  mounted() { this.fetchLines() },
}
</script>

<style scoped lang="scss">
.config-tabs {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-6);
}

.config-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.65rem var(--space-4);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color var(--duration-base) var(--ease-out), border-color var(--duration-base) var(--ease-out);

  &:hover { color: var(--color-text); }
  &.active { color: var(--color-brand); border-bottom-color: var(--color-brand); }
  svg { flex-shrink: 0; }
}

.config-panel {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--panel-shadow);
  padding: var(--space-6);
}

.opt-intro {
  display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4);
  margin-bottom: var(--space-4);
  h2 { font-size: var(--text-lg); }
  .opt-desc { color: var(--color-text-secondary); font-size: var(--text-sm); margin-top: 2px; }
}

.line-add {
  display: flex; gap: var(--space-2); margin-bottom: var(--space-4); flex-wrap: wrap;
  input {
    padding: 0.55rem 0.7rem;
    border: 1.5px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    font-size: var(--text-base); font-family: inherit; color: var(--color-text); background: var(--color-surface);
    &:focus { outline: none; border-color: var(--color-brand); }
    &:first-child { min-width: 180px; }
    &:nth-child(2) { flex: 1; min-width: 200px; }
  }
}

.opt-list { list-style: none; display: flex; flex-direction: column; gap: var(--space-2); max-width: 640px; }

.opt-row {
  display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md);
}

.opt-value { font-weight: 600; font-size: var(--text-base); color: var(--color-text); display: inline-flex; align-items: center; gap: var(--space-2); }
.line-running {
  font-size: var(--text-xs); font-weight: 600; color: var(--color-success);
  background: var(--color-success-bg); padding: 1px 8px; border-radius: var(--radius-full);
}
.opt-actions { display: flex; align-items: center; gap: var(--space-3); flex-shrink: 0; }
.line-comment { font-size: var(--text-sm); color: var(--color-text-muted); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
