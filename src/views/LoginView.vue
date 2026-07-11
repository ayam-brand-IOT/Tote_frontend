<template>
  <div class="login-screen">
    <div class="login-card">
      <div class="login-brand">
        <span class="login-mark"><AppIcon name="fish" :size="26" /></span>
        <div class="login-brand-text">
          <span class="login-eyebrow">Ayam Brand</span>
          <span class="login-title">Production Monitor</span>
        </div>
      </div>

      <h1 class="login-heading">Sign in</h1>
      <p class="login-desc">Access the plant production portal.</p>

      <Transition name="banner">
        <div v-if="error" class="banner banner-error"><AppIcon name="alert-circle" :size="18" />{{ error }}</div>
      </Transition>

      <form class="login-form" @submit.prevent="submit">
        <div class="form-group">
          <label for="username">Username</label>
          <input id="username" v-model.trim="username" autocomplete="username" required
            placeholder="e.g., manager" :disabled="loading" ref="userInput" />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-wrap">
            <input :type="showPw ? 'text' : 'password'" id="password" v-model="password"
              autocomplete="current-password" required placeholder="••••••••" :disabled="loading" />
            <button type="button" class="pw-toggle" @click="showPw = !showPw"
              :aria-label="showPw ? 'Hide password' : 'Show password'">
              <AppIcon :name="showPw ? 'eye-off' : 'eye'" :size="16" />
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary login-submit" :disabled="loading || !username || !password">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="login-hint">
        Default demo accounts — <strong>manager / manager123</strong> (management) ·
        <strong>operator / operator123</strong> (production). Change them in Config.
      </p>
    </div>
  </div>
</template>

<script>
import AppIcon from '@/components/icons/AppIcon.vue'

export default {
  name: 'LoginView',
  components: { AppIcon },
  data() {
    return { username: '', password: '', showPw: false, loading: false, error: null }
  },
  methods: {
    async submit() {
      this.loading = true
      this.error = null
      try {
        await this.$store.dispatch('login', { username: this.username, password: this.password })
        const redirect = this.$route.query.redirect
        this.$router.push(redirect && typeof redirect === 'string' ? redirect : { name: 'dashboard' })
      } catch (err) {
        this.error = err.message || 'Could not sign in'
      } finally {
        this.loading = false
      }
    },
  },
  mounted() {
    this.$refs.userInput && this.$refs.userInput.focus()
  },
}
</script>

<style scoped lang="scss">
.login-screen {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background:
    radial-gradient(1200px 600px at 15% -10%, rgba(200, 16, 46, 0.10), transparent 60%),
    radial-gradient(1000px 600px at 100% 110%, rgba(20, 33, 61, 0.14), transparent 55%),
    var(--dash-bg);
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-8);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.login-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: var(--radius-md);
  background: var(--color-brand);
  color: #fff;
  flex-shrink: 0;
}

.login-brand-text { display: flex; flex-direction: column; line-height: 1.15; }
.login-eyebrow {
  font-family: var(--font-heading);
  font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--color-gold);
}
.login-title { font-family: var(--font-heading); font-size: var(--text-lg); font-weight: 600; color: var(--color-text); }

.login-heading { font-size: var(--text-2xl); margin-bottom: var(--space-1); }
.login-desc { color: var(--color-text-secondary); font-size: var(--text-base); margin-bottom: var(--space-6); }

.login-form { margin-top: var(--space-2); }

.password-wrap {
  position: relative;
  input { width: 100%; padding-right: 42px; }
  .pw-toggle {
    position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
    width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
    border: none; background: transparent; color: var(--color-text-muted); cursor: pointer;
    border-radius: var(--radius-sm);
    &:hover { color: var(--color-text); background: var(--color-bg); }
  }
}

.login-submit { width: 100%; margin-top: var(--space-2); padding: 0.7rem; }

.login-hint {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.6;
  strong { color: var(--color-text-secondary); font-weight: 600; }
}
</style>
