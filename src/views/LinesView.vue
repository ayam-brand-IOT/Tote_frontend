<template>
  <div class="lines-view">
    <div class="header">
      <h1>🏭 Production Lines</h1>
      <button @click="openModal('add')" class="add-btn">➕ Add Line</button>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <div v-if="loading && !lines.length" class="loading">Loading production lines...</div>
    <div v-else-if="!lines.length && !loading" class="empty-state">No production lines found. Add your first line!</div>

    <div v-else class="table-container">
      <table class="lines-table">
        <thead>
          <tr>
            <th>Line ID</th>
            <th>Product</th>
            <th>Type</th>
            <th>Size</th>
            <th>Destination</th>
            <th>Comments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in lines" :key="line.line_id" class="line-row">
            <td class="line-id">{{ line.line_id }}</td>
            <td>{{ line.product }}</td>
            <td>{{ line.type }}</td>
            <td>{{ line.size || '-' }}</td>
            <td>{{ line.destination || '-' }}</td>
            <td class="comments">{{ line.comments || '-' }}</td>
            <td class="actions-cell">
              <button @click="openModal('edit', line)" class="edit-btn" title="Edit line">✏️</button>
              <button @click="deleteLine(line.line_id)" class="delete-btn" :disabled="loading" title="Delete line">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="lines.length > 0" class="stats">
      <div class="stat-card">
        <div class="stat-value">{{ lines.length }}</div>
        <div class="stat-label">Total Lines</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ uniqueProducts }}</div>
        <div class="stat-label">Different Products</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ uniqueTypes }}</div>
        <div class="stat-label">Different Types</div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ modalMode === 'add' ? 'Add New Production Line' : `Edit Line ${form.line_id}` }}</h2>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="submitForm" class="line-form">
          <div class="form-row">
            <div class="form-group">
              <label>Line ID *</label>
              <input v-model="form.line_id" required :disabled="modalMode === 'edit'" placeholder="e.g., S001" />
            </div>
            <div class="form-group">
              <label>Product *</label>
              <input v-model="form.product" required placeholder="e.g., Salmon" />
            </div>
            <div class="form-group">
              <label>Type *</label>
              <input v-model="form.type" required placeholder="e.g., Fillet" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Size</label>
              <input v-model="form.size" placeholder="e.g., 200-400g" />
            </div>
            <div class="form-group">
              <label>Destination</label>
              <input v-model="form.destination" placeholder="e.g., USA" />
            </div>
          </div>
          <div class="form-group">
            <label>Comments</label>
            <textarea v-model="form.comments" rows="3" placeholder="Additional notes..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn" :disabled="loading">
              {{ loading ? 'Saving...' : modalMode === 'add' ? '✓ Create Line' : '✓ Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
const emptyForm = () => ({ line_id: '', product: '', type: '', size: '', destination: '', comments: '' })

export default {
  name: 'LinesView',
  data() {
    return {
      lines: [],
      loading: false,
      error: null,
      successMessage: null,
      showModal: false,
      modalMode: 'add',
      form: emptyForm()
    }
  },
  computed: {
    uniqueProducts() { return new Set(this.lines.map(l => l.product)).size },
    uniqueTypes()    { return new Set(this.lines.map(l => l.type)).size }
  },
  methods: {
    openModal(mode, line = null) {
      this.modalMode = mode
      this.form = mode === 'edit' && line ? { ...line } : emptyForm()
      this.error = null
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
      this.error = null
    },
    async submitForm() {
      this.modalMode === 'add' ? await this.addLine() : await this.updateLine()
    },
    async fetchLines() {
      this.loading = true
      this.error = null
      try {
        const res = await fetch('/api/lines')
        if (!res.ok) throw new Error(`Error: ${res.status}`)
        const data = await res.json()
        this.lines = data.lines || []
      } catch (err) {
        this.error = `Error loading lines: ${err.message}`
      } finally {
        this.loading = false
      }
    },
    async addLine() {
      this.loading = true
      this.error = null
      try {
        const res = await fetch('/api/lines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form)
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || `Error: ${res.status}`)
        }
        this.successMessage = `✓ Line ${this.form.line_id} created successfully!`
        this.closeModal()
        await this.fetchLines()
        setTimeout(() => { this.successMessage = null }, 3000)
      } catch (err) {
        this.error = `Error creating line: ${err.message}`
      } finally {
        this.loading = false
      }
    },
    async updateLine() {
      this.loading = true
      this.error = null
      try {
        const { product, type, size, destination, comments } = this.form
        const res = await fetch(`/api/lines/${this.form.line_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product, type, size, destination, comments })
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || `Error: ${res.status}`)
        }
        this.successMessage = `✓ Line ${this.form.line_id} updated successfully!`
        this.closeModal()
        await this.fetchLines()
        setTimeout(() => { this.successMessage = null }, 3000)
      } catch (err) {
        this.error = `Error updating line: ${err.message}`
      } finally {
        this.loading = false
      }
    },
    async deleteLine(lineId) {
      if (!confirm(`Delete line ${lineId}?`)) return
      this.loading = true
      this.error = null
      try {
        const res = await fetch(`/api/lines/${lineId}`, { method: 'DELETE' })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || `Error: ${res.status}`)
        }
        this.successMessage = `✓ Line ${lineId} deleted successfully!`
        await this.fetchLines()
        setTimeout(() => { this.successMessage = null }, 3000)
      } catch (err) {
        this.error = `Error deleting line: ${err.message}`
      } finally {
        this.loading = false
      }
    }
  },
  mounted() { this.fetchLines() }
}
</script>

<style scoped lang="scss">
.lines-view {
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

.lines-table {
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

  tbody .line-row {
    transition: background 0.2s;
    &:hover { background: #f8f9fa; }

    td {
      padding: 12px 10px;
      border-bottom: 1px solid #dee2e6;
    }

    .line-id { font-weight: 600; color: #42b983; }

    .comments {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions-cell {
      display: flex;
      gap: 6px;
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

    .delete-btn {
      padding: 5px 10px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
      &:hover:not(:disabled) { background: #c82333; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
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
  max-width: 680px;
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

.line-form {
  padding: 25px;

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;

    label {
      font-weight: 600;
      margin-bottom: 5px;
      color: #374151;
      font-size: 13px;
    }

    input, textarea {
      padding: 10px;
      border: 1.5px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
      &:focus { outline: none; border-color: #42b983; }
      &:disabled { background: #f3f4f6; color: #6b7280; cursor: not-allowed; }
    }

    textarea { resize: vertical; font-family: inherit; }
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;

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
  .line-form .form-row { grid-template-columns: 1fr; }
  .lines-table { font-size: 12px; thead th, tbody td { padding: 8px 5px; } }
}
</style>
