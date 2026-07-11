<template>
  <div class="users-manager">
    <div class="opt-intro">
      <div>
        <h2>Users</h2>
        <p class="opt-desc">Management and production accounts for the portal.</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="openAdd"><AppIcon name="plus" :size="16" />Add User</button>
    </div>

    <Transition name="banner">
      <div v-if="error" class="banner banner-error"><AppIcon name="alert-circle" :size="18" />{{ error }}</div>
    </Transition>
    <Transition name="banner">
      <div v-if="success" class="banner banner-success"><AppIcon name="check-circle" :size="18" />{{ success }}</div>
    </Transition>

    <EmptyState v-if="loading && !users.length" loading message="Loading users…" compact />

    <div v-else class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Username</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td class="u-name">
              {{ u.username }}
              <span v-if="u.username === currentUsername" class="you-tag">you</span>
            </td>
            <td>
              <span class="role-badge" :class="u.role === 'management' ? 'role-mgmt' : 'role-prod'">
                <AppIcon :name="u.role === 'management' ? 'shield' : 'user'" :size="13" />
                {{ u.role === 'management' ? 'Management' : 'Production' }}
              </span>
            </td>
            <td>
              <span class="status-pill" :class="u.active ? 'on' : 'off'">{{ u.active ? 'Active' : 'Inactive' }}</span>
            </td>
            <td class="u-date">{{ formatDate(u.created_at) }}</td>
            <td>
              <div class="actions-cell">
                <button class="icon-btn icon-btn-primary" @click="openEdit(u)" aria-label="Edit user"><AppIcon name="pencil" :size="16" /></button>
                <button class="icon-btn icon-btn-danger" @click="remove(u)" :disabled="u.username === currentUsername" aria-label="Delete user"><AppIcon name="trash" :size="16" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add / edit modal -->
    <BaseModal v-if="showModal" :title="mode === 'add' ? 'Add User' : `Edit ${form.username}`" @close="closeModal">
      <form class="modal-form" @submit.prevent="submit">
        <div class="form-group">
          <label>Username <span v-if="mode === 'add'" class="required-mark">*</span></label>
          <input v-model.trim="form.username" :disabled="mode === 'edit'" required placeholder="e.g., supervisor" />
        </div>
        <div class="form-group">
          <label>Role <span class="required-mark">*</span></label>
          <select v-model="form.role" required>
            <option value="production">Production</option>
            <option value="management">Management</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ mode === 'add' ? 'Password' : 'New password (leave blank to keep)' }} <span v-if="mode === 'add'" class="required-mark">*</span></label>
          <input v-model="form.password" type="password" :required="mode === 'add'" minlength="6" placeholder="At least 6 characters" autocomplete="new-password" />
        </div>
        <div v-if="mode === 'edit'" class="form-group form-check">
          <label><input type="checkbox" v-model="form.active" /> Account active</label>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="closeModal">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="busy">
            <span v-if="busy" class="spinner"></span>
            {{ busy ? 'Saving…' : mode === 'add' ? 'Create User' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script>
import AppIcon from '@/components/icons/AppIcon.vue'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'

export default {
  name: 'ConfigUsers',
  components: { AppIcon, BaseModal, EmptyState },
  data() {
    return {
      users: [],
      loading: false,
      busy: false,
      error: null,
      success: null,
      showModal: false,
      mode: 'add',
      form: { id: null, username: '', role: 'production', password: '', active: true },
    }
  },
  computed: {
    currentUsername() { return this.$store.getters.username },
  },
  methods: {
    formatDate(ts) {
      return ts ? new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
    },
    flash(msg) { this.success = msg; setTimeout(() => { this.success = null }, 3000) },
    async fetchUsers() {
      this.loading = true
      this.error = null
      try {
        const res = await fetch('/api/users')
        if (!res.ok) throw new Error(`Error ${res.status}`)
        this.users = (await res.json()).users || []
      } catch (err) { this.error = err.message } finally { this.loading = false }
    },
    openAdd() {
      this.mode = 'add'
      this.form = { id: null, username: '', role: 'production', password: '', active: true }
      this.error = null
      this.showModal = true
    },
    openEdit(u) {
      this.mode = 'edit'
      this.form = { id: u.id, username: u.username, role: u.role, password: '', active: !!u.active }
      this.error = null
      this.showModal = true
    },
    closeModal() { this.showModal = false },
    async submit() {
      this.busy = true
      this.error = null
      try {
        if (this.mode === 'add') {
          const res = await fetch('/api/users', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: this.form.username, password: this.form.password, role: this.form.role }),
          })
          if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error ${res.status}`) }
          this.flash(`User ${this.form.username} created`)
        } else {
          const body = { role: this.form.role, active: this.form.active }
          if (this.form.password) body.password = this.form.password
          const res = await fetch(`/api/users/${this.form.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          })
          if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error ${res.status}`) }
          this.flash(`User ${this.form.username} updated`)
        }
        this.closeModal()
        await this.fetchUsers()
      } catch (err) { this.error = err.message } finally { this.busy = false }
    },
    async remove(u) {
      if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return
      this.busy = true
      this.error = null
      try {
        const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error ${res.status}`) }
        this.flash(`User ${u.username} deleted`)
        await this.fetchUsers()
      } catch (err) { this.error = err.message } finally { this.busy = false }
    },
  },
  mounted() { this.fetchUsers() },
}
</script>

<style scoped lang="scss">
.opt-intro {
  display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4);
  margin-bottom: var(--space-4);
  h2 { font-size: var(--text-lg); }
  .opt-desc { color: var(--color-text-secondary); font-size: var(--text-sm); margin-top: 2px; }
}

.u-name { font-weight: 600; color: var(--color-text); }
.you-tag {
  font-size: var(--text-xs); font-weight: 700; color: var(--color-info);
  background: var(--color-info-bg); padding: 1px 7px; border-radius: var(--radius-full); margin-left: 6px;
}
.u-date { font-size: var(--text-sm); color: var(--color-text-muted); }

.role-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: var(--text-xs); font-weight: 600; padding: 3px 10px; border-radius: var(--radius-full);
  &.role-mgmt { background: var(--color-brand-light); color: var(--color-brand-dark); }
  &.role-prod { background: var(--color-info-bg); color: var(--color-info); }
}

.status-pill {
  font-size: var(--text-xs); font-weight: 600; padding: 3px 10px; border-radius: var(--radius-full);
  &.on { background: var(--color-success-bg); color: var(--color-success); }
  &.off { background: var(--color-bg); color: var(--color-text-muted); }
}

.form-check label { display: inline-flex; align-items: center; gap: var(--space-2); cursor: pointer; font-weight: 600; color: var(--color-text-secondary); }
.form-check input { width: auto; }
</style>
