<template>
  <div id="app">
    <nav>
      <router-link to="/totes">📦 Totes</router-link> |
      <router-link to="/lines">🏭 Lines</router-link> |
      <router-link to="/export">📥 Export</router-link> |
      <router-link to="/about">ℹ️ About</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #f5f5f5;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}

nav {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;

  a {
    font-weight: bold;
    color: #2c3e50;
    text-decoration: none;
    padding: 10px 15px;
    border-radius: 5px;
    transition: all 0.3s;

    &:hover {
      background: #f8f9fa;
    }

    &.router-link-exact-active {
      color: white;
      background: #42b983;
    }
  }
}
</style>

