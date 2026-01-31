<template>
  <div class="totes-list">
    <div class="header">
      <h1>📦 Tote List</h1>
      <button @click="refreshTotes" class="refresh-btn" :disabled="loading">
        {{ loading ? '⟳ Loading...' : '🔄 Refresh' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>

    <div v-if="loading && !totes.length" class="loading">
      Loading totes...
    </div>

    <div v-else-if="!totes.length" class="empty-state">
      No totes registered
    </div>

    <div v-else class="table-container">
      <table class="totes-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Linked Lines</th>
            <th>Fish (kg)</th>
            <th>Ice In (kg)</th>
            <th>Water In (kg)</th>
            <th>Tote (kg)</th>
            <th>Raw (kg)</th>
            <th>Ice Out (kg)</th>
            <th>Water Out (kg)</th>
            <th>Temp Out (°C)</th>
            <th>Status</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tote in sortedTotes" :key="tote.id" class="tote-row">
            <td class="tote-id">{{ tote.tote_id }}</td>
            <td class="linked-lines">
              <span v-if="tote.linked_lines && tote.linked_lines.length > 0">
                <span v-for="(line, index) in tote.linked_lines" :key="line.line_id" class="line-badge">
                  {{ line.line_id }}: {{ line.product }} ({{ line.type }})
                  <span v-if="index < tote.linked_lines.length - 1">, </span>
                </span>
              </span>
              <span v-else class="no-link">-</span>
            </td>
            <td>{{ formatNumber(tote.fish_kg) }}</td>
            <td>{{ formatNumber(tote.ice_kg) }}</td>
            <td>{{ formatNumber(tote.water_kg) }}</td>
            <td>{{ formatNumber(tote.tote_kg) }}</td>
            <td>{{ formatNumber(tote.raw_kg) }}</td>
            <td>{{ formatNumber(tote.ice_out_kg) }}</td>
            <td>{{ formatNumber(tote.water_out_kg) }}</td>
            <td>{{ formatTemp(tote.temp_out) }}</td>
            <td>
              <span :class="'status-badge status-' + tote.status">{{ tote.status || 'active' }}</span>
            </td>
            <td>{{ formatDate(tote.created_at) }}</td>
            <td>{{ formatDate(tote.updated_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="stats" v-if="totes.length">
      <div class="stat-card">
        <div class="stat-value">{{ totes.length }}</div>
        <div class="stat-label">Total Totes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalFishKg.toFixed(2) }}</div>
        <div class="stat-label">Total Fish (kg)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalIceOutKg.toFixed(2) }}</div>
        <div class="stat-label">Total Ice Out (kg)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalWaterOutKg.toFixed(2) }}</div>
        <div class="stat-label">Total Water Out (kg)</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TotesList',
  data() {
    return {
      totes: [],
      loading: false,
      error: null,
      autoRefreshInterval: null
    }
  },
  computed: {
    sortedTotes() {
      return [...this.totes].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at)
      })
    },
    totalFishKg() {
      return this.totes.reduce((sum, tote) => sum + (parseFloat(tote.fish_kg) || 0), 0)
    },
    totalIceOutKg() {
      return this.totes.reduce((sum, tote) => sum + (parseFloat(tote.ice_out_kg) || 0), 0)
    },
    totalWaterOutKg() {
      return this.totes.reduce((sum, tote) => sum + (parseFloat(tote.water_out_kg) || 0), 0)
    }
  },
  methods: {
    async fetchTotes() {
      this.loading = true
      this.error = null
      try {
        const response = await fetch('/api/totes')
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        const data = await response.json()
        this.totes = data.totes || []
      } catch (err) {
        this.error = `Error loading totes: ${err.message}`
        console.error('Error fetching totes:', err)
      } finally {
        this.loading = false
      }
    },
    refreshTotes() {
      this.fetchTotes()
    },
    formatNumber(value) {
      if (value === null || value === undefined) return '-'
      return parseFloat(value).toFixed(2)
    },
    formatTemp(value) {
      if (value === null || value === undefined) return '-'
      return `${parseFloat(value).toFixed(1)}°C`
    },
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },
  mounted() {
    this.fetchTotes()
    // Auto-refresh every 30 seconds
    this.autoRefreshInterval = setInterval(() => {
      this.fetchTotes()
    }, 30000)
  },
  beforeUnmount() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval)
    }
  }
}
</script>

<style scoped lang="scss">
.totes-list {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h1 {
    margin: 0;
    color: #2c3e50;
  }
}

.refresh-btn {
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;

  &:hover:not(:disabled) {
    background: #359268;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.error-message {
  background: #ffe6e6;
  color: #d8000c;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  border-left: 4px solid #d8000c;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
}

.table-container {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.totes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    background: #f8f9fa;
    
    th {
      padding: 15px 10px;
      text-align: left;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 2px solid #dee2e6;
      white-space: nowrap;
    }
  }

  tbody {
    .tote-row {
      transition: background 0.2s;

      &:hover {
        background: #f8f9fa;
      }

      td {
        padding: 12px 10px;
        border-bottom: 1px solid #dee2e6;
      }

      .tote-id {
        font-weight: 600;
        color: #42b983;
      }

      .linked-lines {
        .line-badge {
          font-size: 13px;
          color: #2c3e50;
          display: inline-block;
        }

        .no-link {
          color: #9ca3af;
          font-style: italic;
        }
      }
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
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;

  .stat-value {
    font-size: 32px;
    font-weight: bold;
    color: #42b983;
    margin-bottom: 5px;
  }

  .stat-label {
    font-size: 14px;
    color: #666;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;

    h1 {
      font-size: 24px;
    }
  }

  .totes-table {
    font-size: 12px;

    thead th,
    tbody td {
      padding: 8px 5px;
    }
  }
}
</style>
