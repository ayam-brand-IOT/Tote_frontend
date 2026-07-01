<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1><AppIcon name="box" :size="24" />Tote List</h1>
        <p class="page-subtitle">Track inbound weights, outbound yields and the status of every tote on the floor.</p>
      </div>
      <div class="page-header-actions">
        <button @click="openModal('add')" class="btn btn-primary">
          <AppIcon name="plus" :size="18" />Add Tote
        </button>
        <button @click="refreshTotes" class="btn btn-outline" :disabled="loading">
          <span v-if="loading" class="spinner" style="color: var(--color-text-secondary)"></span>
          <AppIcon v-else name="refresh" :size="18" />
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <Transition name="banner">
      <div v-if="error" class="banner banner-error"><AppIcon name="alert-circle" :size="20" />{{ error }}</div>
    </Transition>
    <Transition name="banner">
      <div v-if="successMessage" class="banner banner-success"><AppIcon name="check-circle" :size="20" />{{ successMessage }}</div>
    </Transition>

    <EmptyState v-if="loading && !totes.length" loading message="Loading totes..." />
    <EmptyState v-else-if="!totes.length" icon="box" title="No totes yet"
      message="Add your first tote to start tracking inbound weights and outbound yields." />

    <div v-else class="table-wrap">
      <table class="data-table">
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
                  {{ line.line_id }}: {{ line.product }} ({{ line.type }}){{ line.destination ? ' → ' + line.destination : '' }}
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
            <td><StatusBadge :status="tote.status" /></td>
            <td>{{ formatDate(tote.created_at) }}</td>
            <td>{{ formatDate(tote.updated_at) }}</td>
            <td>
              <button @click="openModal('edit', tote)" class="icon-btn icon-btn-primary" :aria-label="`Edit tote ${tote.tote_id}`">
                <AppIcon name="pencil" :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="stats-grid" v-if="totes.length">
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

    <BaseModal v-if="showModal" :title="modalMode === 'add' ? 'Add New Tote' : `Edit Tote ${form.tote_id}`" @close="closeModal">
      <form @submit.prevent="submitForm" class="modal-form">
        <div class="form-group">
          <label>Tote ID <span class="required-mark">*</span></label>
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
          <button type="button" @click="closeModal" class="btn btn-ghost">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Saving...' : modalMode === 'add' ? 'Create Tote' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script>
import AppIcon from '@/components/icons/AppIcon.vue'
import BaseModal from '@/components/BaseModal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import EmptyState from '@/components/EmptyState.vue'

const emptyForm = () => ({
  tote_id: '',
  tote_kg: 0, ice_kg: 0, water_kg: 0,
  fish_kg: null, raw_kg: 0,
  ice_out_kg: null, water_out_kg: 0, temp_out: null
})

export default {
  name: 'TotesList',
  components: { AppIcon, BaseModal, StatusBadge, EmptyState },
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
        this.successMessage = `Tote ${this.form.tote_id} created!`
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
        this.successMessage = `Tote ${tote_id} updated!`
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
.tote-id { font-weight: 600; color: var(--color-brand); }

.linked-lines {
  .line-badge { font-size: var(--text-sm); color: var(--color-text); display: inline-block; }
  .no-link { color: var(--color-text-muted); font-style: italic; }
}

@media (max-width: 768px) {
  .data-table { font-size: 12px; thead th, tbody td { padding: 8px 5px; } }
}
</style>
