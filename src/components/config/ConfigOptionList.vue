<template>
  <div class="opt-manager">
    <div class="opt-intro">
      <h2>{{ title }}</h2>
      <p v-if="description" class="opt-desc">{{ description }}</p>
    </div>

    <Transition name="banner">
      <div v-if="error" class="banner banner-error"><AppIcon name="alert-circle" :size="18" />{{ error }}</div>
    </Transition>

    <form class="opt-add" @submit.prevent="add">
      <input v-model.trim="newValue" :placeholder="placeholder" :disabled="busy" maxlength="120" />
      <button type="submit" class="btn btn-primary btn-sm" :disabled="busy || !newValue">
        <AppIcon name="plus" :size="16" />Add
      </button>
    </form>

    <EmptyState v-if="loading && !items.length" loading message="Loading…" compact />
    <EmptyState v-else-if="!items.length" icon="filter" :message="`No ${title.toLowerCase()} yet.`" compact />

    <ul v-else class="opt-list">
      <li v-for="item in items" :key="item.id" class="opt-row" :class="{ inactive: !item.active }">
        <template v-if="editingId === item.id">
          <input v-model.trim="editValue" class="opt-edit-input" maxlength="120" @keyup.enter="saveEdit(item)" @keyup.esc="cancelEdit" />
          <div class="opt-actions">
            <button class="icon-btn icon-btn-success" @click="saveEdit(item)" :disabled="busy" aria-label="Save"><AppIcon name="check-circle" :size="16" /></button>
            <button class="icon-btn" @click="cancelEdit" aria-label="Cancel"><AppIcon name="close" :size="16" /></button>
          </div>
        </template>
        <template v-else>
          <span class="opt-value">
            {{ item.value }}
            <span v-if="!item.active" class="opt-badge">inactive</span>
          </span>
          <div class="opt-actions">
            <button class="icon-btn" @click="toggleActive(item)" :disabled="busy"
              :aria-label="item.active ? 'Deactivate' : 'Activate'" :title="item.active ? 'Deactivate' : 'Activate'">
              <AppIcon :name="item.active ? 'close' : 'check-circle'" :size="16" />
            </button>
            <button class="icon-btn icon-btn-primary" @click="startEdit(item)" :disabled="busy" aria-label="Rename"><AppIcon name="pencil" :size="16" /></button>
            <button class="icon-btn icon-btn-danger" @click="remove(item)" :disabled="busy" aria-label="Delete"><AppIcon name="trash" :size="16" /></button>
          </div>
        </template>
      </li>
    </ul>
  </div>
</template>

<script>
import AppIcon from '@/components/icons/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'

export default {
  name: 'ConfigOptionList',
  components: { AppIcon, EmptyState },
  props: {
    category: { type: String, required: true },   // 'destination' | 'fish_type' | 'fish_size'
    title: { type: String, required: true },
    description: { type: String, default: '' },
    placeholder: { type: String, default: 'New value…' },
  },
  data() {
    return {
      items: [],
      loading: false,
      busy: false,
      error: null,
      newValue: '',
      editingId: null,
      editValue: '',
    }
  },
  methods: {
    async fetchItems() {
      this.loading = true
      this.error = null
      try {
        const res = await fetch('/api/config/options')
        if (!res.ok) throw new Error(`Error ${res.status}`)
        const data = await res.json()
        this.items = (data.options && data.options[this.category]) || []
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },
    async add() {
      if (!this.newValue) return
      this.busy = true
      this.error = null
      try {
        const res = await fetch('/api/config/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: this.category, value: this.newValue }),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error ${res.status}`) }
        this.newValue = ''
        await this.fetchItems()
      } catch (err) { this.error = err.message } finally { this.busy = false }
    },
    startEdit(item) { this.editingId = item.id; this.editValue = item.value },
    cancelEdit() { this.editingId = null; this.editValue = '' },
    async saveEdit(item) {
      if (!this.editValue || this.editValue === item.value) { this.cancelEdit(); return }
      await this.patch(item.id, { value: this.editValue })
      this.cancelEdit()
    },
    async toggleActive(item) { await this.patch(item.id, { active: item.active ? 0 : 1 }) },
    async patch(id, body) {
      this.busy = true
      this.error = null
      try {
        const res = await fetch(`/api/config/options/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error ${res.status}`) }
        await this.fetchItems()
      } catch (err) { this.error = err.message } finally { this.busy = false }
    },
    async remove(item) {
      if (!confirm(`Delete "${item.value}"? Existing records keep the value; it just won't appear in dropdowns.`)) return
      this.busy = true
      this.error = null
      try {
        const res = await fetch(`/api/config/options/${item.id}`, { method: 'DELETE' })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error ${res.status}`) }
        await this.fetchItems()
      } catch (err) { this.error = err.message } finally { this.busy = false }
    },
  },
  mounted() { this.fetchItems() },
}
</script>

<style scoped lang="scss">
.opt-intro { margin-bottom: var(--space-4); }
.opt-intro h2 { font-size: var(--text-lg); }
.opt-desc { color: var(--color-text-secondary); font-size: var(--text-sm); margin-top: 2px; }

.opt-add {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  max-width: 460px;

  input {
    flex: 1;
    padding: 0.55rem 0.7rem;
    border: 1.5px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    font-size: var(--text-base);
    font-family: inherit;
    color: var(--color-text);
    background: var(--color-surface);
    &:focus { outline: none; border-color: var(--color-brand); }
  }
}

.opt-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 560px;
}

.opt-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  &.inactive { opacity: 0.6; }
}

.opt-value {
  font-weight: 600;
  font-size: var(--text-base);
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.opt-badge {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  background: var(--color-bg);
  padding: 1px 8px;
  border-radius: var(--radius-full);
}

.opt-edit-input {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1.5px solid var(--color-brand);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  font-family: inherit;
  &:focus { outline: none; }
}

.opt-actions { display: flex; gap: var(--space-2); flex-shrink: 0; }
</style>
