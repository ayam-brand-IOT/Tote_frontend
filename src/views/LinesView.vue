<template>
  <div class="lines-view">
    <div class="header">
      <h1>🏭 Production Lines</h1>
      <button @click="openLineModal('add')" class="add-btn">➕ Add Line</button>
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
            <th>Active Product</th>
            <th>Type</th>
            <th>Size</th>
            <th>Destination</th>
            <th>Since</th>
            <th>Line Comments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in lines" :key="line.line_id" class="line-row">
            <td class="line-id">{{ line.line_id }}</td>
            <td>
              <span v-if="line.product" class="product-badge">{{ line.product }}</span>
              <span v-else class="no-product">— unassigned —</span>
            </td>
            <td>{{ line.type || '-' }}</td>
            <td>{{ line.size || '-' }}</td>
            <td>{{ line.destination || '-' }}</td>
            <td class="since">{{ line.started_at ? formatDate(line.started_at) : '-' }}</td>
            <td class="comments">{{ line.comments || '-' }}</td>
            <td class="actions-cell">
              <button @click="openAssignModal(line)" class="assign-btn" title="Assign product">🔄</button>
              <button @click="openHistoryModal(line)" class="history-btn" title="View assignment history">📋</button>
              <button @click="openLineModal('edit', line)" class="edit-btn" title="Edit comments">✏️</button>
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
        <div class="stat-value">{{ linesWithProduct }}</div>
        <div class="stat-label">With Active Product</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ lines.length - linesWithProduct }}</div>
        <div class="stat-label">Unassigned</div>
      </div>
    </div>

    <!-- Line add/edit modal -->
    <div v-if="showLineModal" class="modal-overlay" @click.self="closeLineModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ lineModalMode === 'add' ? 'Add New Production Line' : `Edit Line ${lineForm.line_id}` }}</h2>
          <button class="modal-close" @click="closeLineModal">×</button>
        </div>
        <form @submit.prevent="submitLineForm" class="line-form">
          <div class="form-group">
            <label>Line ID *</label>
            <input v-model="lineForm.line_id" required :disabled="lineModalMode === 'edit'" placeholder="e.g., L001" />
          </div>
          <div class="form-group">
            <label>Destination</label>
            <input v-model="lineForm.destination" placeholder="e.g., Factory A, USA" />
          </div>
          <div class="form-group">
            <label>Comments</label>
            <textarea v-model="lineForm.comments" rows="3" placeholder="Line-specific notes..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeLineModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn" :disabled="loading">
              {{ loading ? 'Saving...' : lineModalMode === 'add' ? '✓ Create Line' : '✓ Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Assign product modal -->
    <div v-if="showAssignModal" class="modal-overlay" @click.self="closeAssignModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Assign Product to Line {{ assignTarget?.line_id }}</h2>
          <button class="modal-close" @click="closeAssignModal">×</button>
        </div>
        <div v-if="assignTarget?.product" class="current-assignment">
          <span class="current-label">Current:</span>
          <span class="current-value">{{ assignTarget.product }} · {{ assignTarget.type }}</span>
          <span class="current-warning">Assigning a new product will end this assignment.</span>
        </div>
        <form @submit.prevent="submitAssign" class="line-form">
          <div class="form-group">
            <label>Product *</label>
            <select v-model="assignForm.product_id" required :disabled="loadingProducts">
              <option value="" disabled>{{ loadingProducts ? 'Loading...' : 'Select a product' }}</option>
              <option v-for="p in products" :key="p.id" :value="p.id">
                {{ p.product }} · {{ p.type }}{{ p.size ? ' · ' + p.size : '' }}
              </option>
            </select>
            <span v-if="!products.length && !loadingProducts" class="field-hint">
              No products available. <router-link to="/products">Create one first.</router-link>
            </span>
          </div>
          <div class="form-group">
            <label>Assignment Comments</label>
            <textarea v-model="assignForm.comments" rows="2" placeholder="e.g., batch #, shift..."></textarea>
          </div>
          <div class="modal-actions">
            <button v-if="assignTarget?.line_product_id" type="button" @click="unassign" class="unassign-btn" :disabled="loading">
              {{ loading ? '...' : '✕ End Current Assignment' }}
            </button>
            <button type="button" @click="closeAssignModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn" :disabled="loading || !assignForm.product_id">
              {{ loading ? 'Saving...' : '✓ Assign' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- History modal -->
    <div v-if="showHistoryModal" class="modal-overlay" @click.self="closeHistoryModal">
      <div class="modal modal-wide">
        <div class="modal-header">
          <h2>Assignment History — Line {{ historyLine?.line_id }}</h2>
          <button class="modal-close" @click="closeHistoryModal">×</button>
        </div>
        <div class="history-body">
          <div v-if="loadingHistory" class="loading">Loading...</div>
          <div v-else-if="!assignments.length" class="empty-state small">No assignments recorded for this line.</div>
          <table v-else class="history-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Size</th>
                <th>Started</th>
                <th>Ended</th>
                <th>Status</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in assignments" :key="a.id" :class="{ 'active-row': !a.ended_at }">
                <td class="product-name">{{ a.product }}</td>
                <td>{{ a.type }}</td>
                <td>{{ a.size || '-' }}</td>
                <td>{{ formatDate(a.started_at) }}</td>
                <td>{{ a.ended_at ? formatDate(a.ended_at) : '—' }}</td>
                <td><span :class="a.ended_at ? 'badge-ended' : 'badge-active'">{{ a.ended_at ? 'Ended' : 'Active' }}</span></td>
                <td class="comments">{{ a.assignment_comments || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LinesView',
  data() {
    return {
      lines: [],
      products: [],
      assignments: [],
      loading: false,
      loadingProducts: false,
      loadingHistory: false,
      error: null,
      successMessage: null,
      // Line modal
      showLineModal: false,
      lineModalMode: 'add',
      lineForm: { line_id: '', destination: '', comments: '' },
      // Assign modal
      showAssignModal: false,
      assignTarget: null,
      assignForm: { product_id: '', comments: '' },
      // History modal
      showHistoryModal: false,
      historyLine: null,
    }
  },
  computed: {
    linesWithProduct() { return this.lines.filter(l => l.product).length }
  },
  methods: {
    formatDate(ts) {
      return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    },

    // ── Line modal ──────────────────────────────────────────────────────────
    openLineModal(mode, line = null) {
      this.lineModalMode = mode;
      this.lineForm = mode === 'edit' && line
        ? { line_id: line.line_id, destination: line.destination || '', comments: line.comments || '' }
        : { line_id: '', destination: '', comments: '' };
      this.error = null;
      this.showLineModal = true;
    },
    closeLineModal() { this.showLineModal = false; this.error = null; },
    async submitLineForm() { this.lineModalMode === 'add' ? await this.addLine() : await this.updateLine(); },

    async addLine() {
      this.loading = true; this.error = null;
      try {
        const res = await fetch('/api/lines', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line_id: this.lineForm.line_id, destination: this.lineForm.destination || null, comments: this.lineForm.comments || null })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error: ${res.status}`); }
        this.successMessage = `✓ Line ${this.lineForm.line_id} created successfully!`;
        this.closeLineModal();
        await this.fetchLines();
        setTimeout(() => { this.successMessage = null; }, 3000);
      } catch (err) { this.error = `Error creating line: ${err.message}`; }
      finally { this.loading = false; }
    },
    async updateLine() {
      this.loading = true; this.error = null;
      try {
        const res = await fetch(`/api/lines/${this.lineForm.line_id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination: this.lineForm.destination || null, comments: this.lineForm.comments || null })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error: ${res.status}`); }
        this.successMessage = `✓ Line ${this.lineForm.line_id} updated!`;
        this.closeLineModal();
        await this.fetchLines();
        setTimeout(() => { this.successMessage = null; }, 3000);
      } catch (err) { this.error = `Error updating line: ${err.message}`; }
      finally { this.loading = false; }
    },
    async deleteLine(lineId) {
      if (!confirm(`Delete line ${lineId}?`)) return;
      this.loading = true; this.error = null;
      try {
        const res = await fetch(`/api/lines/${lineId}`, { method: 'DELETE' });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error: ${res.status}`); }
        this.successMessage = `✓ Line ${lineId} deleted!`;
        await this.fetchLines();
        setTimeout(() => { this.successMessage = null; }, 3000);
      } catch (err) { this.error = `Error deleting line: ${err.message}`; }
      finally { this.loading = false; }
    },

    // ── Assign modal ────────────────────────────────────────────────────────
    async openAssignModal(line) {
      this.assignTarget = line;
      this.assignForm = { product_id: '', comments: '' };
      this.error = null;
      this.showAssignModal = true;
      await this.fetchProducts();
    },
    closeAssignModal() { this.showAssignModal = false; this.assignTarget = null; this.error = null; },
    async submitAssign() {
      this.loading = true; this.error = null;
      try {
        const res = await fetch(`/api/lines/${this.assignTarget.line_id}/assign`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: this.assignForm.product_id, comments: this.assignForm.comments || null })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error: ${res.status}`); }
        this.successMessage = `✓ Product assigned to line ${this.assignTarget.line_id}!`;
        this.closeAssignModal();
        await this.fetchLines();
        setTimeout(() => { this.successMessage = null; }, 3000);
      } catch (err) { this.error = `Error assigning product: ${err.message}`; }
      finally { this.loading = false; }
    },
    async unassign() {
      if (!confirm(`End the current product assignment for line ${this.assignTarget.line_id}?`)) return;
      this.loading = true; this.error = null;
      try {
        const res = await fetch(`/api/lines/${this.assignTarget.line_id}/unassign`, { method: 'POST' });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error: ${res.status}`); }
        this.successMessage = `✓ Assignment ended for line ${this.assignTarget.line_id}.`;
        this.closeAssignModal();
        await this.fetchLines();
        setTimeout(() => { this.successMessage = null; }, 3000);
      } catch (err) { this.error = `Error ending assignment: ${err.message}`; }
      finally { this.loading = false; }
    },

    // ── History modal ───────────────────────────────────────────────────────
    async openHistoryModal(line) {
      this.historyLine = line;
      this.assignments = [];
      this.showHistoryModal = true;
      this.loadingHistory = true;
      try {
        const res = await fetch(`/api/lines/${line.line_id}/assignments`);
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        this.assignments = data.assignments || [];
      } catch (err) {
        this.error = `Error loading history: ${err.message}`;
      } finally { this.loadingHistory = false; }
    },
    closeHistoryModal() { this.showHistoryModal = false; this.historyLine = null; this.assignments = []; },

    // ── Data fetching ───────────────────────────────────────────────────────
    async fetchLines() {
      this.loading = true; this.error = null;
      try {
        const res = await fetch('/api/lines');
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        this.lines = (await res.json()).lines || [];
      } catch (err) { this.error = `Error loading lines: ${err.message}`; }
      finally { this.loading = false; }
    },
    async fetchProducts() {
      this.loadingProducts = true;
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        this.products = (await res.json()).products || [];
      } catch (err) { this.error = `Error loading products: ${err.message}`; }
      finally { this.loadingProducts = false; }
    }
  },
  mounted() { this.fetchLines(); }
}
</script>

<style scoped lang="scss">
.lines-view { max-width: 1400px; margin: 0 auto; padding: 20px; }

.header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
  h1 { margin: 0; color: #2c3e50; }
}
.add-btn { padding: 10px 20px; background: #42b983; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: 600; transition: background 0.2s; &:hover { background: #359268; } }

.error-message { background: #ffe6e6; color: #d8000c; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #d8000c; }
.success-message { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #28a745; }
.loading, .empty-state { text-align: center; padding: 40px; color: #666; font-size: 18px; }
.empty-state.small { padding: 20px; font-size: 14px; }

.table-container { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }

.lines-table {
  width: 100%; border-collapse: collapse; font-size: 14px;
  thead { background: #f8f9fa; th { padding: 15px 10px; text-align: left; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #dee2e6; white-space: nowrap; } }
  tbody .line-row {
    transition: background 0.2s; &:hover { background: #f8f9fa; }
    td { padding: 12px 10px; border-bottom: 1px solid #dee2e6; vertical-align: middle; }
    .line-id { font-weight: 600; color: #42b983; }
    .since { font-size: 12px; color: #9ca3af; white-space: nowrap; }
    .comments { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .actions-cell { display: flex; gap: 5px; }
  }
}

.product-badge { background: #dbeafe; color: #1e40af; padding: 2px 10px; border-radius: 12px; font-weight: 600; font-size: 13px; }
.no-product { color: #d1d5db; font-style: italic; font-size: 13px; }

.assign-btn  { padding: 5px 8px; background: #42b983; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; transition: background 0.2s; &:hover { background: #359268; } }
.history-btn { padding: 5px 8px; background: #8b5cf6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; transition: background 0.2s; &:hover { background: #7c3aed; } }
.edit-btn    { padding: 5px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; transition: background 0.2s; &:hover { background: #2563eb; } }
.delete-btn  { padding: 5px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; transition: background 0.2s; &:hover:not(:disabled) { background: #c82333; } &:disabled { opacity: 0.6; cursor: not-allowed; } }

.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
.stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;
  .stat-value { font-size: 32px; font-weight: bold; color: #42b983; margin-bottom: 5px; }
  .stat-label { font-size: 14px; color: #666; }
}

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal { background: white; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; animation: modalIn 0.2s ease; }
.modal.modal-wide { max-width: 900px; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; border-bottom: 1px solid #e5e7eb;
  h2 { margin: 0; color: #2c3e50; font-size: 18px; }
  .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; line-height: 1; padding: 0 4px; &:hover { color: #111; } }
}

.current-assignment { margin: 16px 25px 0; padding: 12px 16px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; font-size: 13px;
  .current-label { font-weight: 700; color: #92400e; margin-right: 6px; }
  .current-value { color: #1f2937; font-weight: 600; }
  .current-warning { display: block; color: #b45309; margin-top: 4px; font-size: 12px; }
}

.line-form {
  padding: 25px;
  .form-group { display: flex; flex-direction: column; margin-bottom: 16px;
    label { font-weight: 600; margin-bottom: 5px; color: #374151; font-size: 13px; }
    input, select, textarea { padding: 10px; border: 1.5px solid #d1d5db; border-radius: 6px; font-size: 14px; transition: border-color 0.2s; &:focus { outline: none; border-color: #42b983; } &:disabled { background: #f3f4f6; color: #6b7280; cursor: not-allowed; } }
    select { cursor: pointer; background: white; }
    textarea { resize: vertical; font-family: inherit; }
    .field-hint { font-size: 12px; color: #9ca3af; margin-top: 4px; a { color: #3b82f6; text-decoration: none; &:hover { text-decoration: underline; } } }
  }
}

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; flex-wrap: wrap;
  .unassign-btn { padding: 10px 20px; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: auto; transition: background 0.2s; &:hover:not(:disabled) { background: #fecaca; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
  .cancel-btn { padding: 10px 24px; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: background 0.2s; &:hover { background: #e5e7eb; } }
  .submit-btn { padding: 10px 24px; background: #42b983; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: background 0.2s; &:hover:not(:disabled) { background: #359268; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
}

.history-body { padding: 20px; }
.history-table { width: 100%; border-collapse: collapse; font-size: 13px;
  th { padding: 10px 8px; text-align: left; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #dee2e6; background: #f8f9fa; white-space: nowrap; }
  td { padding: 10px 8px; border-bottom: 1px solid #dee2e6; }
  .product-name { font-weight: 600; color: #1d4ed8; }
  .comments { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .active-row { background: #f0fdf4; }
}
.badge-active { background: #dcfce7; color: #166534; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.badge-ended  { background: #f3f4f6; color: #6b7280; padding: 2px 10px; border-radius: 12px; font-size: 12px; }

@media (max-width: 768px) {
  .header { flex-direction: column; gap: 15px; h1 { font-size: 24px; } }
  .lines-table { font-size: 12px; thead th, tbody td { padding: 8px 5px; } }
}
</style>
