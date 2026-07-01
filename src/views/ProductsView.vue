<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1><AppIcon name="fish" :size="24" />Products</h1>
        <p class="page-subtitle">Manage the fish types and sizes that flow through your production lines.</p>
      </div>
      <button @click="openModal('add')" class="btn btn-primary">
        <AppIcon name="plus" :size="18" />Add Product
      </button>
    </div>

    <div v-if="error" class="banner banner-error"><AppIcon name="alert-circle" :size="20" />{{ error }}</div>
    <div v-if="successMessage" class="banner banner-success"><AppIcon name="check-circle" :size="20" />{{ successMessage }}</div>

    <EmptyState v-if="loading && !products.length" loading message="Loading products..." />
    <EmptyState v-else-if="!products.length && !loading" icon="fish" title="No products yet"
      message="Add your first product to start assigning it to a production line." />

    <div v-else class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Product</th>
            <th>Type</th>
            <th>Size</th>
            <th>Comments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id" class="product-row">
            <td class="product-id">{{ p.id }}</td>
            <td class="product-name">{{ p.product }}</td>
            <td>{{ p.type }}</td>
            <td>{{ p.size || '-' }}</td>
            <td class="comments">{{ p.comments || '-' }}</td>
            <td>
              <div class="actions-cell">
                <button @click="openModal('edit', p)" class="icon-btn icon-btn-primary" :aria-label="`Edit ${p.product}`">
                  <AppIcon name="pencil" :size="16" />
                </button>
                <button @click="deleteProduct(p.id)" class="icon-btn icon-btn-danger" :disabled="loading" :aria-label="`Delete ${p.product}`">
                  <AppIcon name="trash" :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="products.length > 0" class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ products.length }}</div>
        <div class="stat-label">Total Products</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ uniqueTypes }}</div>
        <div class="stat-label">Different Types</div>
      </div>
    </div>

    <BaseModal v-if="showModal" :title="modalMode === 'add' ? 'Add New Product' : `Edit Product #${form.id}`" @close="closeModal">
      <form @submit.prevent="submitForm" class="modal-form">
        <div class="form-row">
          <div class="form-group">
            <label>Product <span class="required-mark">*</span></label>
            <input v-model="form.product" required placeholder="e.g., Salmon" />
          </div>
          <div class="form-group">
            <label>Type <span class="required-mark">*</span></label>
            <select v-model="form.type" required>
              <option value="" disabled>Select fish type</option>
              <option v-for="t in fishTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Size</label>
            <select v-model="form.size">
              <option value="">— No size —</option>
              <option v-for="s in fishSizes" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Comments</label>
          <textarea v-model="form.comments" rows="3" placeholder="Additional notes..."></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" @click="closeModal" class="btn btn-ghost">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Saving...' : modalMode === 'add' ? 'Create Product' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script>
import { FISH_TYPES, FISH_SIZES } from '@/constants/options'
import AppIcon from '@/components/icons/AppIcon.vue'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'

const emptyForm = () => ({ id: null, product: '', type: '', size: '', comments: '' })

export default {
  name: 'ProductsView',
  components: { AppIcon, BaseModal, EmptyState },
  data() {
    return {
      fishTypes: FISH_TYPES,
      fishSizes: FISH_SIZES,
      products: [],
      loading: false,
      error: null,
      successMessage: null,
      showModal: false,
      modalMode: 'add',
      form: emptyForm()
    }
  },
  computed: {
    uniqueTypes() { return new Set(this.products.map(p => p.type)).size }
  },
  methods: {
    openModal(mode, product = null) {
      this.modalMode = mode
      this.form = mode === 'edit' && product ? { ...product } : emptyForm()
      this.error = null
      this.showModal = true
    },
    closeModal() { this.showModal = false; this.error = null },
    async submitForm() { this.modalMode === 'add' ? await this.addProduct() : await this.updateProduct() },
    async fetchProducts() {
      this.loading = true; this.error = null
      try {
        const res = await fetch('/api/products')
        if (!res.ok) throw new Error(`Error: ${res.status}`)
        const data = await res.json()
        this.products = data.products || []
      } catch (err) {
        this.error = `Error loading products: ${err.message}`
      } finally { this.loading = false }
    },
    async addProduct() {
      this.loading = true; this.error = null
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form)
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || `Error: ${res.status}`) }
        this.successMessage = `Product created successfully!`
        this.closeModal()
        await this.fetchProducts()
        setTimeout(() => { this.successMessage = null }, 3000)
      } catch (err) {
        this.error = `Error creating product: ${err.message}`
      } finally { this.loading = false }
    },
    async updateProduct() {
      this.loading = true; this.error = null
      try {
        const { product, type, size, comments } = this.form
        const res = await fetch(`/api/products/${this.form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product, type, size, comments })
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || `Error: ${res.status}`) }
        this.successMessage = `Product updated successfully!`
        this.closeModal()
        await this.fetchProducts()
        setTimeout(() => { this.successMessage = null }, 3000)
      } catch (err) {
        this.error = `Error updating product: ${err.message}`
      } finally { this.loading = false }
    },
    async deleteProduct(id) {
      if (!confirm(`Delete product #${id}?`)) return
      this.loading = true; this.error = null
      try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || `Error: ${res.status}`) }
        this.successMessage = `Product deleted successfully!`
        await this.fetchProducts()
        setTimeout(() => { this.successMessage = null }, 3000)
      } catch (err) {
        this.error = `Error deleting product: ${err.message}`
      } finally { this.loading = false }
    }
  },
  mounted() { this.fetchProducts() }
}
</script>

<style scoped lang="scss">
.product-id   { font-weight: 600; color: var(--color-text-muted); font-size: var(--text-xs); }
.product-name { font-weight: 600; color: var(--color-info); }
.comments { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 768px) {
  .data-table { font-size: 12px; thead th, tbody td { padding: 8px 5px; } }
}
</style>
