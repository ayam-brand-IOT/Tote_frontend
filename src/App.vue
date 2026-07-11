<template>
  <div id="app">
    <header v-if="showChrome" class="app-header">
      <div class="app-header-inner">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">
            <AppIcon name="fish" :size="20" />
          </span>
          <span class="brand-text">
            <span class="brand-eyebrow">Ayam Brand</span>
            <span class="brand-title">Production Monitor</span>
          </span>
        </div>

        <button class="nav-toggle" type="button" @click="mobileNavOpen = !mobileNavOpen"
          :aria-expanded="mobileNavOpen" aria-controls="primary-nav" aria-label="Toggle navigation menu">
          <AppIcon :name="mobileNavOpen ? 'close' : 'menu'" :size="22" />
        </button>

        <nav id="primary-nav" class="app-nav" :class="{ open: mobileNavOpen }">
          <div class="app-nav-inner">
            <router-link to="/" class="nav-link" @click="mobileNavOpen = false">
              <AppIcon name="grid" :size="18" />
              <span>Dashboard</span>
            </router-link>
            <router-link to="/lines" class="nav-link" @click="mobileNavOpen = false">
              <AppIcon name="factory" :size="18" />
              <span>Lines</span>
            </router-link>
            <router-link to="/products" class="nav-link" @click="mobileNavOpen = false">
              <AppIcon name="fish" :size="18" />
              <span>Raw Materials</span>
            </router-link>
            <router-link v-if="isManagement" to="/config" class="nav-link" @click="mobileNavOpen = false">
              <AppIcon name="settings" :size="18" />
              <span>Config</span>
            </router-link>
            <span class="nav-divider" aria-hidden="true"></span>
            <router-link to="/totes" class="nav-link nav-link-muted" @click="mobileNavOpen = false">
              <AppIcon name="box" :size="18" />
              <span>Active Totes</span>
            </router-link>

            <!-- User chip + logout (in the drawer on mobile) -->
            <div class="nav-user">
              <span class="nav-user-info">
                <span class="nav-user-avatar" :class="isManagement ? 'is-mgmt' : 'is-prod'">
                  <AppIcon :name="isManagement ? 'shield' : 'user'" :size="15" />
                </span>
                <span class="nav-user-text">
                  <span class="nav-user-name">{{ username }}</span>
                  <span class="nav-user-role">{{ isManagement ? 'Management' : 'Production' }}</span>
                </span>
              </span>
              <button class="nav-logout" type="button" @click="logout" aria-label="Sign out">
                <AppIcon name="logout" :size="18" />
              </button>
            </div>
          </div>
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
  },
  computed: {
    isAuthenticated() { return this.$store.getters.isAuthenticated },
    isManagement() { return this.$store.getters.isManagement },
    username() { return this.$store.getters.username },
    showChrome() { return this.isAuthenticated && this.$route.name !== 'login' },
  },
  methods: {
    logout() {
      this.mobileNavOpen = false
      this.$store.dispatch('logout')
      this.$router.push({ name: 'login' })
    },
  },
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
  // Ayam Brand red — vertical shade for depth, gold hairline underline.
  background: linear-gradient(180deg, #d81531 0%, var(--color-brand) 55%, var(--color-brand-dark) 100%);
  border-bottom: 2px solid var(--color-gold);
  box-shadow: var(--shadow-md);
}

.app-header-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
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
  // White logo tile with the red mark, echoing the Ayam Brand lockup.
  background: #fff;
  color: var(--color-brand);
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
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
  color: #ffd27a;
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
  align-items: center;
  gap: var(--space-1);
}

// Desktop: keep every nav item — links AND the user chip — on one row.
// (.nav-link is inline-flex while .nav-user is a block-level flex box, so
// without an explicit flex row here the user chip drops onto a second line.)
.app-nav-inner {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-md);
  color: rgba(255, 255, 255, 0.88);
  text-decoration: none;
  font-weight: 600;
  font-size: var(--text-sm);
  white-space: nowrap;
  transition: background-color var(--duration-base) var(--ease-out), color var(--duration-base) var(--ease-out);

  &:hover { background: rgba(255, 255, 255, 0.16); color: #fff; }

  // Active = crisp white pill with red label (matches the brand lockup).
  &.router-link-exact-active {
    background: #fff;
    color: var(--color-brand);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
  }
}

.nav-link-muted {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.nav-tag {
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--radius-full);
  padding: 1px 7px;
  margin-left: 2px;
}

.router-link-exact-active .nav-tag {
  color: rgba(255, 255, 255, 0.85);
  border-color: rgba(255, 255, 255, 0.4);
}

.nav-divider {
  width: 1px;
  align-self: stretch;
  margin: 0.35rem var(--space-1);
  background: rgba(255, 255, 255, 0.28);
}

// User chip + logout
.nav-user {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: var(--space-2);
  padding-left: var(--space-3);
  border-left: 1px solid rgba(255, 255, 255, 0.28);
}

.nav-user-info { display: flex; align-items: center; gap: var(--space-2); }

.nav-user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  &.is-mgmt { background: #fff; color: var(--color-brand); }
  &.is-prod { background: rgba(255, 255, 255, 0.22); color: #fff; }
}

.nav-user-text { display: flex; flex-direction: column; line-height: 1.1; }
.nav-user-name { font-size: var(--text-sm); font-weight: 600; color: #fff; }
.nav-user-role { font-size: 0.625rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #ffd27a; }

.nav-logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: background-color var(--duration-base) var(--ease-out), color var(--duration-base) var(--ease-out);
  &:hover { background: rgba(255, 255, 255, 0.18); color: #fff; }
  &:active { transform: scale(0.94); }
}

main {
  flex: 1;
}

@media (max-width: 860px) {
  .app-header-inner { flex-wrap: wrap; padding: var(--space-3) var(--space-4); }
  .nav-toggle { display: inline-flex; }

  // Accordion trick: animating a 0fr → 1fr row track gives a smooth
  // auto-height open/close without measuring the content in JS. The iOS-like
  // drawer curve reads as a natural "unfurl" rather than a mechanical resize.
  .app-nav {
    display: grid;
    grid-template-rows: 0fr;
    width: 100%;
    opacity: 0;
    transition: grid-template-rows var(--duration-slow) var(--ease-drawer),
                opacity var(--duration-base) var(--ease-out);

    &.open {
      grid-template-rows: 1fr;
      opacity: 1;
    }
  }

  .app-nav-inner {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    overflow: hidden;
    padding-top: var(--space-2);
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    margin-top: var(--space-2);
  }

  .nav-link { width: 100%; }
  .nav-divider { display: none; }

  .nav-user {
    width: 100%;
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    margin-top: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    justify-content: space-between;
  }
}
</style>
