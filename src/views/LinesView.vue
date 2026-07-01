<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1><AppIcon name="factory" :size="24" />Production Lines</h1>
        <p class="page-subtitle">See which product and factory each line is running, and switch assignments.</p>
      </div>
      <button @click="openLineModal('add')" class="btn btn-primary">
        <AppIcon name="plus" :size="18" />Add Line
      </button>
    </div>

    <div v-if="error" class="banner banner-error"><AppIcon name="alert-circle" :size="20" />{{ error }}</div>
    <div v-if="successMessage" class="banner banner-success"><AppIcon name="check-circle" :size="20" />{{ successMessage }}</div>

    <EmptyState v-if="loading && !lines.length" loading message="Loading production lines..." />
    <EmptyState v-else-if="!lines.length && !loading" icon="factory" title="No production lines yet"
      message="Add your first line to start assigning products and destinations." />

    <div v-else class="table-wrap">
      <table class="data-table">
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
            <td>
              <span v-if="line.destination" class="dest-badge">{{ line.destination }}</span>
              <span v-else class="no-product">—</span>
            </td>
            <td class="since">{{ line.started_at ? formatDate(line.started_at) : '-' }}</td>
            <td class="comments">{{ line.comments || '-' }}</td>
            <td>
              <div class="actions-cell">
                <button @click="openAssignModal(line)" class="icon-btn icon-btn-success" :aria-label="`Assign product to ${line.line_id}`">
                  <AppIcon name="shuffle" :size="16" />
                </button>
                <button @click="openHistoryModal(line)" class="icon-btn icon-btn-purple" :aria-label="`View assignment history for ${line.line_id}`">
                  <AppIcon name="history" :size="16" />
                </button>
                <button @click="openLineModal('edit', line)" class="icon-btn icon-btn-primary" :aria-label="`Edit line ${line.line_id}`">
                  <AppIcon name="pencil" :size="16" />
                </button>
                <button @click="deleteLine(line.line_id)" class="icon-btn icon-btn-danger" :disabled="loading" :aria-label="`Delete line ${line.line_id}`">
                  <AppIcon name="trash" :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="lines.length > 0" class="stats-grid">
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
    <BaseModal v-if="showLineModal" :title="lineModalMode === 'add' ? 'Add New Production Line' : `Edit Line ${lineForm.line_id}`" @close="closeLineModal">
      <form @submit.prevent="submitLineForm" class="modal-form">
        <div class="form-group">
          <label>Line ID <span class="required-mark">*</span></label>
          <input v-model="lineForm.line_id" required :disabled="lineModalMode === 'edit'" placeholder="e.g., L001" />
        </div>
        <div class="form-group">
          <label>Comments</label>
          <textarea v-model="lineForm.comments" rows="3" placeholder="Line-specific notes..."></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" @click="closeLineModal" class="btn btn-ghost">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Saving...' : lineModalMode === 'add' ? 'Create Line' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Assign product modal -->
    <BaseModal v-if="showAssignModal" title="Assign Product to Line" @close="closeAssignModal">
      <div v-if="assignTarget?.product" class="current-assignment">
        <span class="current-label">Current:</span>
        <span class="current-value">{{ assignTarget.product }} · {{ assignTarget.type }}{{ assignTarget.destination ? ' → ' + assignTarget.destination : '' }}</span>
        <span class="current-warning">Assigning a new product will end this assignment.</span>
      </div>
      <form @submit.prevent="submitAssign" class="modal-form">
        <div class="form-group">
          <label>Line <span class="required-mark">*</span></label>
          <select v-model="assignForm.line_id" required @change="onAssignLineChange">
            <option value="" disabled>Select a line</option>
            <option v-for="l in lines" :key="l.line_id" :value="l.line_id">
              {{ l.line_id }}{{ l.product ? ' — ' + l.product + ' (' + l.type + ')' : ' — (unassigned)' }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Product <span class="required-mark">*</span></label>
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
          <label>Destination</label>
          <select v-model="assignForm.destination">
            <option value="">— No destination —</option>
            <option v-for="d in destinations" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Assignment Comments</label>
          <textarea v-model="assignForm.comments" rows="2" placeholder="e.g., batch #, shift..."></textarea>
        </div>
        <div class="modal-actions">
          <button v-if="assignTarget?.line_product_id" type="button" @click="unassign" class="btn btn-danger mr-auto" :disabled="loading">
            <AppIcon name="close" :size="16" />{{ loading ? '...' : 'End Current Assignment' }}
          </button>
          <button type="button" @click="closeAssignModal" class="btn btn-ghost">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="loading || !assignForm.product_id || !assignForm.line_id">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Saving...' : 'Assign' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- History modal -->
    <BaseModal v-if="showHistoryModal" :title="`Assignment History — Line ${historyLine?.line_id}`" wide @close="closeHistoryModal">
      <div class="history-body">
        <EmptyState v-if="loadingHistory" loading message="Loading assignment history..." compact />
        <EmptyState v-else-if="!assignments.length" icon="history" message="No assignments recorded for this line." compact />
        <table v-else class="data-table history-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Size</th>
              <th>Destination</th>
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
              <td>{{ a.destination || '-' }}</td>
              <td>{{ formatDate(a.started_at) }}</td>
              <td>{{ a.ended_at ? formatDate(a.ended_at) : '—' }}</td>
              <td><span :class="a.ended_at ? 'badge-ended' : 'badge-active'">{{ a.ended_at ? 'Ended' : 'Active' }}</span></td>
              <td class="comments">{{ a.assignment_comments || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseModal>
  </div>
</template>

<script>
import { FACTORIES } from '@/constants/options'
import AppIcon from '@/components/icons/AppIcon.vue'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'

export default {
  name: 'LinesView',
  components: { AppIcon, BaseModal, EmptyState },
  data() {
    return {
      lines: [],
      products: [],
      assignments: [],
      destinations: FACTORIES,
      loading: false,
      loadingProducts: false,
      loadingHistory: false,
      error: null,
      successMessage: null,
      // Line modal
      showLineModal: false,
      lineModalMode: 'add',
      lineForm: { line_id: '', comments: '' },
      // Assign modal
      showAssignModal: false,
      assignTarget: null,
      assignForm: { line_id: '', product_id: '', destination: '', comments: '' },
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
        ? { line_id: line.line_id, comments: line.comments || '' }
        : { line_id: '', comments: '' };
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
          body: JSON.stringify({ line_id: this.lineForm.line_id, comments: this.lineForm.comments || null })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error: ${res.status}`); }
        this.successMessage = `Line ${this.lineForm.line_id} created successfully!`;
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
          body: JSON.stringify({ comments: this.lineForm.comments || null })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error: ${res.status}`); }
        this.successMessage = `Line ${this.lineForm.line_id} updated!`;
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
        this.successMessage = `Line ${lineId} deleted!`;
        await this.fetchLines();
        setTimeout(() => { this.successMessage = null; }, 3000);
      } catch (err) { this.error = `Error deleting line: ${err.message}`; }
      finally { this.loading = false; }
    },

    // ── Assign modal ────────────────────────────────────────────────────────
    async openAssignModal(line) {
      this.assignTarget = line;
      this.assignForm = {
        line_id: line.line_id,
        product_id: '',
        destination: line.destination || '',
        comments: ''
      };
      this.error = null;
      this.showAssignModal = true;
      await this.fetchProducts();
    },
    onAssignLineChange() {
      const selected = this.lines.find(l => l.line_id === this.assignForm.line_id);
      if (selected) {
        this.assignTarget = selected;
        this.assignForm.destination = selected.destination || '';
      }
    },
    closeAssignModal() { this.showAssignModal = false; this.assignTarget = null; this.error = null; },
    async submitAssign() {
      this.loading = true; this.error = null;
      const lineId = this.assignForm.line_id;
      try {
        const res = await fetch(`/api/lines/${lineId}/assign`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: this.assignForm.product_id,
            destination: this.assignForm.destination || null,
            comments: this.assignForm.comments || null
          })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error: ${res.status}`); }
        this.successMessage = `Product assigned to line ${lineId}!`;
        this.closeAssignModal();
        await this.fetchLines();
        setTimeout(() => { this.successMessage = null; }, 3000);
      } catch (err) { this.error = `Error assigning product: ${err.message}`; }
      finally { this.loading = false; }
    },
    async unassign() {
      const lineId = this.assignForm.line_id;
      if (!confirm(`End the current product assignment for line ${lineId}?`)) return;
      this.loading = true; this.error = null;
      try {
        const res = await fetch(`/api/lines/${lineId}/unassign`, { method: 'POST' });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error: ${res.status}`); }
        this.successMessage = `Assignment ended for line ${lineId}.`;
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
.line-id { font-weight: 600; color: var(--color-brand); }
.since { font-size: var(--text-xs); color: var(--color-text-muted); white-space: nowrap; }
.comments { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.product-badge { background: #dbeafe; color: #1e40af; padding: 2px 10px; border-radius: var(--radius-full); font-weight: 600; font-size: var(--text-sm); }
.dest-badge { background: var(--color-gold-light); color: var(--color-gold); padding: 2px 10px; border-radius: var(--radius-full); font-weight: 600; font-size: var(--text-sm); }
.no-product { color: var(--color-text-muted); font-style: italic; font-size: var(--text-sm); }

.current-assignment {
  margin: var(--space-5) var(--space-6) 0;
  padding: var(--space-3) var(--space-4);
  background: var(--color-warning-bg);
  border: 1px solid #f6ddb0;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);

  .current-label { font-weight: 700; color: var(--color-warning); margin-right: 6px; }
  .current-value { color: var(--color-text); font-weight: 600; }
  .current-warning { display: block; color: var(--color-warning); margin-top: 4px; font-size: var(--text-xs); }
}

.history-body { padding: var(--space-5); }
.history-table {
  font-size: var(--text-sm);
  .product-name { font-weight: 600; color: var(--color-info); }
  .comments { max-width: 150px; }
  .active-row { background: var(--color-success-bg); }
}
.badge-active { background: #dcfce7; color: #166534; padding: 2px 10px; border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: 600; }
.badge-ended  { background: #f3f4f6; color: #6b7280; padding: 2px 10px; border-radius: var(--radius-full); font-size: var(--text-xs); }

@media (max-width: 768px) {
  .data-table { font-size: 12px; thead th, tbody td { padding: 8px 5px; } }
}
</style>
