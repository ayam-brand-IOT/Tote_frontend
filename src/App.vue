<template>
  <div id="app">
    <header class="app-header">
      <div class="app-header-inner">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">
            <AppIcon name="fish" :size="20" />
          </span>
          <span class="brand-text">
            <span class="brand-eyebrow">Ayam Brand</span>
            <span class="brand-title">Tote Management</span>
          </span>
        </div>

        <button class="nav-toggle" type="button" @click="mobileNavOpen = !mobileNavOpen"
          :aria-expanded="mobileNavOpen" aria-controls="primary-nav" aria-label="Toggle navigation menu">
          <AppIcon :name="mobileNavOpen ? 'close' : 'menu'" :size="22" />
        </button>

        <nav id="primary-nav" class="app-nav" :class="{ open: mobileNavOpen }">
          <router-link to="/totes" class="nav-link" @click="mobileNavOpen = false">
            <AppIcon name="box" :size="18" />
            <span>Totes</span>
          </router-link>
          <router-link to="/products" class="nav-link" @click="mobileNavOpen = false">
            <AppIcon name="fish" :size="18" />
            <span>Products</span>
          </router-link>
          <router-link to="/lines" class="nav-link" @click="mobileNavOpen = false">
            <AppIcon name="factory" :size="18" />
            <span>Lines</span>
          </router-link>
          <router-link to="/export" class="nav-link" @click="mobileNavOpen = false">
            <AppIcon name="download" :size="18" />
            <span>Export</span>
          </router-link>
        </nav>
      </div>
    </header>

    <main>
      <router-view/>
    </main>
  </div>
</template>

<script>
import AppIcon from '@/components/icons/AppIcon.vue'

export default {
  name: 'App',
  components: { AppIcon },
  data() {
    return { mobileNavOpen: false }
  }
}
</script>

<style lang="scss">
#app {
  font-family: var(--font-body);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  background: var(--color-ink);
  box-shadow: var(--shadow-md);
}

.app-header-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-right: auto;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--color-brand);
  color: #fff;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand-eyebrow {
  font-family: var(--font-heading);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #e8a33d;
}

.brand-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 600;
  color: #fff;
}

.nav-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background-color var(--duration-base) var(--ease-out);
  &:hover { background: rgba(255, 255, 255, 0.1); }
}

.app-nav {
  display: flex;
  gap: var(--space-1);
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.55rem var(--space-4);
  border-radius: var(--radius-md);
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  font-weight: 600;
  font-size: var(--text-sm);
  transition: background-color var(--duration-base) var(--ease-out), color var(--duration-base) var(--ease-out);

  &:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }

  &.router-link-exact-active {
    background: var(--color-brand);
    color: #fff;
  }
}

main {
  flex: 1;
}

@media (max-width: 720px) {
  .app-header-inner { flex-wrap: wrap; padding: var(--space-3) var(--space-4); }
  .nav-toggle { display: inline-flex; }

  .app-nav {
    display: none;
    flex-direction: column;
    width: 100%;
    gap: var(--space-1);
    padding-top: var(--space-2);
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    margin-top: var(--space-2);

    &.open { display: flex; }

    .nav-link { width: 100%; }
  }
}
</style>
