<template>
  <span class="status-badge" :class="'status-' + (status || 'empty')">
    <span class="dot" aria-hidden="true"></span>
    {{ status || 'empty' }}
  </span>
</template>

<script>
export default {
  name: 'StatusBadge',
  props: {
    status: { type: String, default: 'empty' }
  }
}
</script>

<style scoped lang="scss">
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  &.status-empty                 { background: #eef0f3; color: #5b6472; }
  &.status-inbound-ready         { background: var(--color-info-bg); color: var(--color-info); }
  &.status-product-linked        { background: var(--color-success-bg); color: var(--color-success); }
  &.status-outbound-ready        { background: var(--color-warning-bg); color: var(--color-warning); }
  &.status-in-transit            { background: #f1e8fb; color: #7327c2; }
  &.status-received-for-packing  { background: #e0f6f5; color: #0f7d75; }
  &.status-offloaded-to-clean    { background: var(--color-brand-light); color: var(--color-brand-dark); }
}
</style>
