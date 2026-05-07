<template>
  <div class="products-view">
    <div class="header">
      <h1>🐟 Products</h1>
      <button @click="openModal('add')" class="add-btn">➕ Add Product</button>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <div v-if="loading && !products.length" class="loading">Loading products...</div>
    <div v-else-if="!products.length && !loading" class="empty-state">No products found. Add your first product!</div>

    <div v-else class="table-container">
      <table class="products-table">
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
            <td class="actions-cell">
              <button @click="openModal('edit', p)" class="edit-btn" title="Edit product">✏️</button>
              <button @click="deleteProduct(p.id)" class="delete-btn" :disabled="loading" title="Delete product">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="products.length > 0" class="stats">
      <div class="stat-card">
        <div class="stat-value">{{ products.length }}</div>
        <div class="stat-label">Total Products</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ uniqueTypes }}</div>
        <div class="stat-label">Different Types</div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ modalMode === 'add' ? 'Add New Product' : `Edit Product #${form.id}` }}</h2>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="submitForm" class="product-form">
          <div class="form-row">
            <div class="form-group">
              <label>Product *</label>
              <input v-model="form.product" required placeholder="e.g., Salmon" />
            </div>
            <div class="form-group">
              <label>Type *</label>
              <input v-model="form.type" required placeholder="e.g., Fillet" />
            </div>
            <div class="form-group">
              <label>Size</label>
              <input v-model="form.size" placeholder="e.g., 200-400g" />
            </div>
          </div>
          <div class="form-group">
            <label>Comments</label>
            <textarea v-model="form.comments" rows="3" placeholder="Additional notes..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn" :disabled="loading">
              {{ loading ? 'Saving...' : modalMode === 'add' ? '✓ Create Product' : '✓ Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
const emptyForm = () => ({ id: null, product: '', type: '', size: '', comments: '' })

export default {
  name: 'ProductsView',
  data() {
    return {
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
        this.successMessage = `✓ Product created successfully!`
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
        this.successMessage = `✓ Product updated successfully!`
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
        this.successMessage = `✓ Product deleted successfully!`
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
.products-view {
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
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
  &:hover { background: #2563eb; }
}

.error-message {
  background: #ffe6e6; color: #d8000c; padding: 15px;
  border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #d8000c;
}
.success-message {
  background: #d4edda; color: #155724; padding: 15px;
  border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #28a745;
}
.loading, .empty-state { text-align: center; padding: 40px; color: #666; font-size: 18px; }

.table-container {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    background: #f8f9fa;
    th { padding: 15px 10px; text-align: left; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #dee2e6; white-space: nowrap; }
  }

  tbody .product-row {
    transition: background 0.2s;
    &:hover { background: #f8f9fa; }
    td { padding: 12px 10px; border-bottom: 1px solid #dee2e6; }
    .product-id   { font-weight: 600; color: #9ca3af; font-size: 12px; }
    .product-name { font-weight: 600; color: #3b82f6; }
    .comments { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .actions-cell { display: flex; gap: 6px; }

    .edit-btn {
      padding: 5px 10px; background: #3b82f6; color: white;
      border: none; border-radius: 4px; cursor: pointer; font-size: 14px;
      transition: background 0.2s;
      &:hover { background: #2563eb; }
    }
    .delete-btn {
      padding: 5px 10px; background: #dc3545; color: white;
      border: none; border-radius: 4px; cursor: pointer; font-size: 14px;
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
  background: white; padding: 20px; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;
  .stat-value { font-size: 32px; font-weight: bold; color: #3b82f6; margin-bottom: 5px; }
  .stat-label { font-size: 14px; color: #666; }
}

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
}
.modal {
  background: white; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto;
  animation: modalIn 0.2s ease;
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 25px; border-bottom: 1px solid #e5e7eb;
  h2 { margin: 0; color: #2c3e50; font-size: 18px; }
  .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; line-height: 1; padding: 0 4px; &:hover { color: #111; } }
}
.product-form {
  padding: 25px;
  .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 15px; }
  .form-group {
    display: flex; flex-direction: column; margin-bottom: 15px;
    label { font-weight: 600; margin-bottom: 5px; color: #374151; font-size: 13px; }
    input, textarea {
      padding: 10px; border: 1.5px solid #d1d5db; border-radius: 6px; font-size: 14px; transition: border-color 0.2s;
      &:focus { outline: none; border-color: #3b82f6; }
    }
    textarea { resize: vertical; font-family: inherit; }
  }
}
.modal-actions {
  display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;
  .cancel-btn {
    padding: 10px 24px; background: #f3f4f6; color: #374151;
    border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;
    transition: background 0.2s; &:hover { background: #e5e7eb; }
  }
  .submit-btn {
    padding: 10px 24px; background: #3b82f6; color: white;
    border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;
    transition: background 0.2s;
    &:hover:not(:disabled) { background: #2563eb; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}

@media (max-width: 768px) {
  .header { flex-direction: column; gap: 15px; h1 { font-size: 24px; } }
  .product-form .form-row { grid-template-columns: 1fr; }
  .products-table { font-size: 12px; thead th, tbody td { padding: 8px 5px; } }
}
</style>
