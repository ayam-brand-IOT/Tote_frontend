<template>
  <div class="totes-list">
    <div class="header">
      <h1>📦 Tote List</h1>
      <div class="header-actions">
        <button @click="openModal('add')" class="add-btn">➕ Add Tote</button>
        <button @click="refreshTotes" class="refresh-btn" :disabled="loading">
          {{ loading ? '⟳ Loading...' : '🔄 Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">❌ {{ error }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <div v-if="loading && !totes.length" class="loading">Loading totes...</div>
    <div v-else-if="!totes.length" class="empty-state">No totes registered</div>

    <div v-else class="table-container">
      <table class="totes-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Linked Lines</th>
            <th>Fish (kg)</th>
            <th>Ice In (kg)</th>
            <th>Water In (kg)</th>
            <th>Tote (kg)</th>
            <th>Raw (kg)</th>
            <th>Ice Out (kg)</th>
            <th>Water Out (kg)</th>
            <th>Temp Out (°C)</th>
            <th>Status</th>
            <th>Created</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tote in sortedTotes" :key="tote.id" class="tote-row">
            <td class="tote-id">{{ tote.tote_id }}</td>
            <td class="linked-lines">
              <span v-if="tote.linked_lines && tote.linked_lines.length > 0">
                <span v-for="(line, index) in tote.linked_lines" :key="line.line_id" class="line-badge">
                  {{ line.line_id }}: {{ line.product }} ({{ line.type }})
                  <span v-if="index < tote.linked_lines.length - 1">, </span>
                </span>
              </span>
              <span v-else class="no-link">-</span>
            </td>
            <td>{{ formatNumber(tote.fish_kg) }}</td>
            <td>{{ formatNumber(tote.ice_kg) }}</td>
            <td>{{ formatNumber(tote.water_kg) }}</td>
            <td>{{ formatNumber(tote.tote_kg) }}</td>
            <td>{{ formatNumber(tote.raw_kg) }}</td>
            <td>{{ formatNumber(tote.ice_out_kg) }}</td>
            <td>{{ formatNumber(tote.water_out_kg) }}</td>
            <td>{{ formatTemp(tote.temp_out) }}</td>
            <td>
              <span :class="'status-badge status-' + tote.status">{{ tote.status || 'empty' }}</span>
            </td>
            <td>{{ formatDate(tote.created_at) }}</td>
            <td>{{ formatDate(tote.updated_at) }}</td>
            <td>
              <button @click="openModal('edit', tote)" class="edit-btn" title="Edit tote">✏️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="stats" v-if="totes.length">
      <div class="stat-card">
        <div class="stat-value">{{ totes.length }}</div>
        <div class="stat-label">Total Totes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalFishKg.toFixed(2) }}</div>
        <div class="stat-label">Total Fish (kg)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalIceOutKg.toFixed(2) }}</div>
        <div class="stat-label">Total Ice Out (kg)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalWaterOutKg.toFixed(2) }}</div>
        <div class="stat-label">Total Water Out (kg)</div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ modalMode === 'add' ? 'Add New Tote' : `Edit Tote ${form.tote_id}` }}</h2>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="submitForm" class="tote-form">

          <div class="form-group">
            <label>Tote ID *</label>
            <input v-model="form.tote_id" required :disabled="modalMode === 'edit'" placeholder="e.g., T001" />
          </div>

          <div class="form-section-title">Inbound</div>
          <div class="form-row">
            <div class="form-group">
              <label>Tote (kg)</label>
              <input v-model.number="form.tote_kg" type="number" min="0" step="1" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Ice In (kg)</label>
              <input v-model.number="form.ice_kg" type="number" min="0" step="1" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Water In (kg)</label>
              <input v-model.number="form.water_kg" type="number" min="0" step="1" placeholder="0" />
            </div>
          </div>

          <div class="form-section-title">Outbound</div>
          <div class="form-row">
            <div class="form-group">
              <label>Fish (kg)</label>
              <input v-model.number="form.fish_kg" type="number" min="0" step="1" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Raw (kg)</label>
              <input v-model.number="form.raw_kg" type="number" min="0" step="1" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Ice Out (kg)</label>
              <input v-model.number="form.ice_out_kg" type="number" min="0" step="1" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Water Out (kg)</label>
              <input v-model.number="form.water_out_kg" type="number" min="0" step="1" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Temp Out (°C)</label>
              <input v-model.number="form.temp_out" type="number" step="0.1" placeholder="0.0" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn" :disabled="loading">
              {{ loading ? 'Saving...' : modalMode === 'add' ? '✓ Create Tote' : '✓ Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
const emptyForm = () => ({
  tote_id: '',
  tote_kg: 0, ice_kg: 0, water_kg: 0,
  fish_kg: null, raw_kg: 0,
  ice_out_kg: null, water_out_kg: 0, temp_out: null
})

export default {
  name: 'TotesList',
  data() {
    return {
      totes: [],
      loading: false,
      error: null,
      successMessage: null,
      autoRefreshInterval: null,
      showModal: false,
      modalMode: 'add',
      form: emptyForm()
    }
  },
  computed: {
    sortedTotes() {
      return [...this.totes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    },
    totalFishKg()    { return this.totes.reduce((s, t) => s + (parseFloat(t.fish_kg) || 0), 0) },
    totalIceOutKg()  { return this.totes.reduce((s, t) => s + (parseFloat(t.ice_out_kg) || 0), 0) },
    totalWaterOutKg(){ return this.totes.reduce((s, t) => s + (parseFloat(t.water_out_kg) || 0), 0) }
  },
  methods: {
    openModal(mode, tote = null) {
      this.modalMode = mode
      if (mode === 'edit' && tote) {
        this.form = {
          tote_id:      tote.tote_id,
          tote_kg:      tote.tote_kg      ?? 0,
          ice_kg:       tote.ice_kg       ?? 0,
          water_kg:     tote.water_kg     ?? 0,
          fish_kg:      tote.fish_kg      ?? null,
          raw_kg:       tote.raw_kg       ?? 0,
          ice_out_kg:   tote.ice_out_kg   ?? null,
          water_out_kg: tote.water_out_kg ?? 0,
          temp_out:     tote.temp_out     ?? null
        }
      } else {
        this.form = emptyForm()
      }
      this.error = null
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
      this.error = null
    },
    async submitForm() {
      this.modalMode === 'add' ? await this.addTote() : await this.updateTote()
    },
    async fetchTotes() {
      this.loading = true
      this.error = null
      try {
        const res = await fetch('/api/totes')
        if (!res.ok) throw new Error(`Error: ${res.status}`)
        const data = await res.json()
        this.totes = data.totes || []
      } catch (err) {
        this.error = `Error loading totes: ${err.message}`
      } finally {
        this.loading = false
      }
    },
    refreshTotes() { this.fetchTotes() },
    async addTote() {
      this.loading = true
      this.error = null
      try {
        const res = await fetch('/api/totes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form)
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || `Error: ${res.status}`)
        }
        this.successMessage = `✓ Tote ${this.form.tote_id} created!`
        this.closeModal()
        await this.fetchTotes()
        setTimeout(() => { this.successMessage = null }, 3000)
      } catch (err) {
        this.error = `Error creating tote: ${err.message}`
      } finally {
        this.loading = false
      }
    },
    async updateTote() {
      this.loading = true
      this.error = null
      try {
        const { tote_id, ...fields } = this.form
        const res = await fetch(`/api/totes/${tote_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields)
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || `Error: ${res.status}`)
        }
        this.successMessage = `✓ Tote ${tote_id} updated!`
        this.closeModal()
        await this.fetchTotes()
        setTimeout(() => { this.successMessage = null }, 3000)
      } catch (err) {
        this.error = `Error updating tote: ${err.message}`
      } finally {
        this.loading = false
      }
    },
    formatNumber(value) {
      if (value === null || value === undefined) return '-'
      return parseFloat(value).toFixed(2)
    },
    formatTemp(value) {
      if (value === null || value === undefined) return '-'
      return `${parseFloat(value).toFixed(1)}°C`
    },
    formatDate(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      })
    }
  },
  mounted() {
    this.fetchTotes()
    this.autoRefreshInterval = setInterval(() => this.fetchTotes(), 30000)
  },
  beforeUnmount() {
    if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval)
  }
}
</script>

<style scoped lang="scss">
.totes-list {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h1 { margin: 0; color: #2c3e50; }
}

.header-actions {
  display: flex;
  gap: 10px;
}

.add-btn {
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
  &:hover { background: #359268; }
}

.refresh-btn {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: #2563eb; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;

  &.status-empty             { background: #f1f3f4; color: #5f6368; }
  &.status-inbound-ready     { background: #e3f2fd; color: #1565c0; }
  &.status-product-linked    { background: #e8f5e9; color: #2e7d32; }
  &.status-outbound-ready    { background: #fff8e1; color: #f57f17; }
  &.status-in-transit        { background: #f3e5f5; color: #6a1b9a; }
  &.status-received-for-packing   { background: #e0f7fa; color: #00695c; }
  &.status-offloaded-to-clean     { background: #fce4ec; color: #880e4f; }
}

.error-message {
  background: #ffe6e6;
  color: #d8000c;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  border-left: 4px solid #d8000c;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  border-left: 4px solid #28a745;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
}

.table-container {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.totes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    background: #f8f9fa;
    th {
      padding: 15px 10px;
      text-align: left;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 2px solid #dee2e6;
      white-space: nowrap;
    }
  }

  tbody .tote-row {
    transition: background 0.2s;
    &:hover { background: #f8f9fa; }

    td {
      padding: 12px 10px;
      border-bottom: 1px solid #dee2e6;
    }

    .tote-id { font-weight: 600; color: #42b983; }

    .linked-lines {
      .line-badge { font-size: 13px; color: #2c3e50; display: inline-block; }
      .no-link { color: #9ca3af; font-style: italic; }
    }

    .edit-btn {
      padding: 5px 10px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
      &:hover { background: #2563eb; }
    }
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;

  .stat-value { font-size: 32px; font-weight: bold; color: #42b983; margin-bottom: 5px; }
  .stat-label { font-size: 14px; color: #666; }
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  width: 100%;
  max-width: 620px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalIn 0.2s ease;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e5e7eb;

  h2 { margin: 0; color: #2c3e50; font-size: 18px; }

  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
    line-height: 1;
    padding: 0 4px;
    &:hover { color: #111; }
  }
}

.tote-form {
  padding: 25px;

  .form-section-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #6b7280;
    margin: 18px 0 10px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 6px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px;
    margin-bottom: 5px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;

    label {
      font-weight: 600;
      margin-bottom: 4px;
      color: #374151;
      font-size: 13px;
    }

    input {
      padding: 9px 10px;
      border: 1.5px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
      &:focus { outline: none; border-color: #42b983; }
      &:disabled { background: #f3f4f6; color: #6b7280; cursor: not-allowed; }
    }
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;

  .cancel-btn {
    padding: 10px 24px;
    background: #f3f4f6;
    color: #374151;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: background 0.2s;
    &:hover { background: #e5e7eb; }
  }

  .submit-btn {
    padding: 10px 24px;
    background: #42b983;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: background 0.2s;
    &:hover:not(:disabled) { background: #359268; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}

@media (max-width: 768px) {
  .header { flex-direction: column; gap: 15px; h1 { font-size: 24px; } }
  .tote-form .form-row { grid-template-columns: 1fr 1fr; }
  .totes-table { font-size: 12px; thead th, tbody td { padding: 8px 5px; } }
}
</style>
