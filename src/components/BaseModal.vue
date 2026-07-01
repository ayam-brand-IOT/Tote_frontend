<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div class="modal-overlay" @click.self="$emit('close')">
        <div
          class="modal"
          :class="{ 'modal-wide': wide }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <div class="modal-header">
            <h2 :id="titleId">{{ title }}</h2>
            <button type="button" class="modal-close" @click="$emit('close')" aria-label="Close dialog">
              <AppIcon name="close" :size="20" />
            </button>
          </div>
          <div class="modal-content">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import AppIcon from './icons/AppIcon.vue'

let idCounter = 0

export default {
  name: 'BaseModal',
  components: { AppIcon },
  props: {
    title: { type: String, required: true },
    wide: { type: Boolean, default: false }
  },
  emits: ['close'],
  data() {
    return { titleId: `modal-title-${++idCounter}` }
  },
  mounted() {
    this._prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', this.onKeydown)
  },
  beforeUnmount() {
    document.body.style.overflow = this._prevOverflow || ''
    document.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    onKeydown(e) {
      if (e.key === 'Escape') this.$emit('close')
    }
  }
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-5);
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  transform-origin: center;
}

.modal.modal-wide {
  max-width: 920px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  background: var(--color-surface);

  h2 {
    font-size: var(--text-lg);
  }

  .modal-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: background-color var(--duration-base) var(--ease-out), color var(--duration-base) var(--ease-out);

    &:hover { background: var(--color-bg); color: var(--color-text); }
  }
}

// Modal transition — fade + scale-in from center (modals stay centered, never
// anchored to a trigger). Starts from 0.95 rather than 0 per motion guidelines.
.modal-enter-active {
  transition: opacity var(--duration-base) var(--ease-out);
  .modal { transition: transform var(--duration-base) var(--ease-out), opacity var(--duration-base) var(--ease-out); }
}
.modal-leave-active {
  transition: opacity var(--duration-fast) var(--ease-in-out);
  .modal { transition: transform var(--duration-fast) var(--ease-in-out), opacity var(--duration-fast) var(--ease-in-out); }
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  .modal { opacity: 0; transform: scale(0.95); }
}
</style>
