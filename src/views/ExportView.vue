<template>
  <div class="export-view">
    <div class="header">
      <h1>📥 Export to Excel</h1>
      <p class="subtitle">Filter totes and download data as an Excel file</p>
    </div>

    <!-- Filters card -->
    <div class="card filters-card">
      <h2>Filters</h2>
      <div class="filters-grid">
        <div class="filter-group">
          <label for="from-date">From</label>
          <input id="from-date" type="date" v-model="filters.from" />
        </div>
        <div class="filter-group">
          <label for="to-date">To</label>
          <input id="to-date" type="date" v-model="filters.to" />
        </div>
        <div class="filter-group">
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
          {{ previewLoading ? '⟳ Loading...' : '🔍 Preview' }}
        </button>
        <button class="btn btn-primary" @click="downloadExcel" :disabled="downloading || previewCount === 0">
          {{ downloading ? '⟳ Generating...' : `📥 Download Excel${previewCount !== null ? ' (' + previewCount + ' rows)' : ''}` }}
        </button>
        <button class="btn btn-ghost" @click="clearFilters">Clear</button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-message">❌ {{ error }}</div>

    <!-- Preview table -->
    <div class="card" v-if="previewRows.length > 0">
      <div class="preview-header">
        <h2>Preview <span class="count-badge">{{ previewRows.length }} totes</span></h2>
      </div>
      <div class="table-container">
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
              <td>
                <span :class="'status-badge status-' + tote.status">{{ tote.status || 'empty' }}</span>
              </td>
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

    <div class="empty-preview" v-else-if="previewed && previewRows.length === 0">
      No totes match the selected filters.
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExportView',
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
.export-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 24px;
  h1 { margin: 0 0 6px; color: #2c3e50; }
  .subtitle { color: #6b7280; margin: 0; }
}

.card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 24px;
  margin-bottom: 24px;

  h2 {
    margin: 0 0 18px;
    color: #2c3e50;
    font-size: 18px;
  }
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
  }

  input, select {
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    color: #2c3e50;
    transition: border-color 0.2s;
    background: white;

    &:focus {
      outline: none;
      border-color: #42b983;
    }
  }
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.btn {
  padding: 10px 22px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled { opacity: 0.55; cursor: not-allowed; }

  &.btn-primary {
    background: #42b983;
    color: white;
    &:hover:not(:disabled) { background: #359268; }
  }

  &.btn-secondary {
    background: #667eea;
    color: white;
    &:hover:not(:disabled) { background: #4f60d4; }
  }

  &.btn-ghost {
    background: #f3f4f6;
    color: #374151;
    &:hover:not(:disabled) { background: #e5e7eb; }
  }
}

.error-message {
  background: #ffe6e6;
  color: #d8000c;
  padding: 14px 18px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #d8000c;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  h2 { margin: 0; }
}

.count-badge {
  background: #42b983;
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 12px;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead th {
    padding: 12px 10px;
    text-align: left;
    font-weight: 600;
    color: #2c3e50;
    background: #f8f9fa;
    border-bottom: 2px solid #dee2e6;
    white-space: nowrap;
  }

  tbody tr {
    transition: background 0.15s;
    &:hover { background: #f8f9fa; }

    td {
      padding: 10px;
      border-bottom: 1px solid #dee2e6;
    }
  }
}

.tote-id-cell { font-weight: 600; color: #42b983; }
.lines-cell { max-width: 260px; font-size: 12px; color: #374151; }
.date-cell { white-space: nowrap; font-size: 12px; color: #6b7280; }
.none { color: #9ca3af; font-style: italic; }

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;

  &.status-empty              { background: #f1f3f4; color: #5f6368; }
  &.status-inbound-ready      { background: #e3f2fd; color: #1565c0; }
  &.status-product-linked     { background: #e8f5e9; color: #2e7d32; }
  &.status-outbound-ready     { background: #fff8e1; color: #f57f17; }
  &.status-in-transit         { background: #f3e5f5; color: #6a1b9a; }
  &.status-received-for-packing { background: #e0f7fa; color: #00695c; }
  &.status-offloaded-to-clean { background: #fce4ec; color: #880e4f; }
}

.empty-preview {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  font-size: 16px;
}

@media (max-width: 768px) {
  .actions { flex-direction: column; align-items: stretch; }
  .btn { text-align: center; }
}
</style>
