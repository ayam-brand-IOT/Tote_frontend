<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1><AppIcon name="download" :size="24" />Export to Excel</h1>
        <p class="page-subtitle">Filter totes and download the data as an Excel file.</p>
      </div>
    </div>

    <!-- Filters card -->
    <div class="card">
      <h2>Filters</h2>
      <div class="form-row">
        <div class="form-group">
          <label for="from-date">From</label>
          <input id="from-date" type="date" v-model="filters.from" />
        </div>
        <div class="form-group">
          <label for="to-date">To</label>
          <input id="to-date" type="date" v-model="filters.to" />
        </div>
        <div class="form-group">
          <label for="status-filter">Status</label>
          <select id="status-filter" v-model="filters.status">
            <option value="">All</option>
            <option value="empty">empty</option>
            <option value="inbound-ready">inbound-ready</option>
            <option value="product-linked">product-linked</option>
            <option value="outbound-ready">outbound-ready</option>
            <option value="in-transit">in-transit</option>
            <option value="received-for-packing">received-for-packing</option>
            <option value="offloaded-to-clean">offloaded-to-clean</option>
          </select>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-secondary" @click="loadPreview" :disabled="previewLoading">
          <span v-if="previewLoading" class="spinner"></span>
          <AppIcon v-else name="search" :size="18" />
          {{ previewLoading ? 'Loading...' : 'Preview' }}
        </button>
        <button class="btn btn-primary" @click="downloadExcel" :disabled="downloading || previewCount === 0">
          <span v-if="downloading" class="spinner"></span>
          <AppIcon v-else name="download" :size="18" />
          {{ downloading ? 'Generating...' : `Download Excel${previewCount !== null ? ' (' + previewCount + ' rows)' : ''}` }}
        </button>
        <button class="btn btn-ghost" @click="clearFilters">Clear</button>
      </div>
    </div>

    <!-- Error -->
    <Transition name="banner">
      <div v-if="error" class="banner banner-error"><AppIcon name="alert-circle" :size="20" />{{ error }}</div>
    </Transition>

    <!-- Preview table -->
    <div class="card" v-if="previewRows.length > 0">
      <div class="preview-header">
        <h2>Preview</h2>
        <span class="count-badge">{{ previewRows.length }} totes</span>
      </div>
      <div class="table-wrap no-margin">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tote ID</th>
              <th>Status</th>
              <th>Fish (kg)</th>
              <th>Ice In (kg)</th>
              <th>Water In (kg)</th>
              <th>Ice Out (kg)</th>
              <th>Water Out (kg)</th>
              <th>Temp (°C)</th>
              <th>Linked Lines</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tote in previewRows" :key="tote.id">
              <td class="tote-id-cell">{{ tote.tote_id }}</td>
              <td><StatusBadge :status="tote.status" /></td>
              <td>{{ fmt(tote.fish_kg) }}</td>
              <td>{{ fmt(tote.ice_kg) }}</td>
              <td>{{ fmt(tote.water_kg) }}</td>
              <td>{{ fmt(tote.ice_out_kg) }}</td>
              <td>{{ fmt(tote.water_out_kg) }}</td>
              <td>{{ fmtTemp(tote.temp_out) }}</td>
              <td class="lines-cell">
                <span v-if="tote.linked_lines && tote.linked_lines.length">
                  {{ tote.linked_lines.map(l => l.line_id + ': ' + l.product).join(', ') }}
                </span>
                <span v-else class="none">-</span>
              </td>
              <td class="date-cell">{{ fmtDate(tote.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <EmptyState v-else-if="previewed && previewRows.length === 0" icon="filter"
      message="No totes match the selected filters." compact />
  </div>
</template>

<script>
import AppIcon from '@/components/icons/AppIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import EmptyState from '@/components/EmptyState.vue'

export default {
  name: 'ExportView',
  components: { AppIcon, StatusBadge, EmptyState },
  data() {
    return {
      filters: {
        from: '',
        to: '',
        status: ''
      },
      previewRows: [],
      previewCount: null,
      previewLoading: false,
      downloading: false,
      previewed: false,
      error: null
    }
  },
  methods: {
    buildQuery() {
      const params = new URLSearchParams()
      if (this.filters.from)   params.set('from', this.filters.from)
      if (this.filters.to)     params.set('to', this.filters.to)
      if (this.filters.status) params.set('status', this.filters.status)
      return params.toString()
    },

    async loadPreview() {
      this.previewLoading = true
      this.error = null
      this.previewed = false
      try {
        // Fetch all totes and filter client-side for the preview
        const response = await fetch('/api/totes')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        let rows = data.totes || []

        // Client-side filtering for preview
        if (this.filters.from) {
          const from = new Date(this.filters.from)
          rows = rows.filter(t => new Date(t.created_at) >= from)
        }
        if (this.filters.to) {
          const to = new Date(this.filters.to)
          to.setHours(23, 59, 59, 999)
          rows = rows.filter(t => new Date(t.created_at) <= to)
        }
        if (this.filters.status) {
          rows = rows.filter(t => t.status === this.filters.status)
        }

        this.previewRows = rows
        this.previewCount = rows.length
        this.previewed = true
      } catch (err) {
        this.error = `Error loading preview: ${err.message}`
      } finally {
        this.previewLoading = false
      }
    },

    async downloadExcel() {
      this.downloading = true
      this.error = null
      try {
        const qs = this.buildQuery()
        const url = `/api/totes/export${qs ? '?' + qs : ''}`

        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = objectUrl

        // Try to get filename from Content-Disposition
        const cd = response.headers.get('Content-Disposition') || ''
        const match = cd.match(/filename="?([^"]+)"?/)
        anchor.download = match ? match[1] : 'totes_export.xlsx'

        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        URL.revokeObjectURL(objectUrl)
      } catch (err) {
        this.error = `Error downloading: ${err.message}`
      } finally {
        this.downloading = false
      }
    },

    clearFilters() {
      this.filters = { from: '', to: '', status: '' }
      this.previewRows = []
      this.previewCount = null
      this.previewed = false
      this.error = null
    },

    fmt(value) {
      if (value === null || value === undefined) return '-'
      return parseFloat(value).toFixed(2)
    },
    fmtTemp(value) {
      if (value === null || value === undefined) return '-'
      return parseFloat(value).toFixed(1)
    },
    fmtDate(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped lang="scss">
.actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  align-items: center;
  margin-top: var(--space-2);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  h2 { margin: 0; }
}

.count-badge {
  background: var(--color-brand);
  color: #fff;
  font-size: var(--text-sm);
  font-weight: 600;
  padding: 2px 10px;
  border-radius: var(--radius-full);
}

.table-wrap.no-margin { margin-bottom: 0; }

.tote-id-cell { font-weight: 600; color: var(--color-brand); }
.lines-cell { max-width: 260px; font-size: var(--text-xs); color: var(--color-text); }
.date-cell { white-space: nowrap; font-size: var(--text-xs); color: var(--color-text-secondary); }
.none { color: var(--color-text-muted); font-style: italic; }

@media (max-width: 768px) {
  .actions { flex-direction: column; align-items: stretch; }
}
</style>
