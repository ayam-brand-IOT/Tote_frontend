<template>
  <div class="lines-view">
    <div class="header">
      <h1>🏭 Production Lines</h1>
      <button @click="showAddForm = !showAddForm" class="add-btn">
        {{ showAddForm ? '✖ Cancel' : '➕ Add Line' }}
      </button>
    </div>

    <!-- Add Line Form -->
    <div v-if="showAddForm" class="add-form-card">
      <h2>Add New Production Line</h2>
      <form @submit.prevent="addLine" class="line-form">
        <div class="form-row">
          <div class="form-group">
            <label for="line_id">Line ID *</label>
            <input 
              type="text" 
              id="line_id" 
              v-model="newLine.line_id" 
              required
              placeholder="e.g., S001"
            />
          </div>

          <div class="form-group">
            <label for="product">Product *</label>
            <input 
              type="text" 
              id="product" 
              v-model="newLine.product" 
              required
              placeholder="e.g., Salmon"
            />
          </div>

          <div class="form-group">
            <label for="type">Type *</label>
            <input 
              type="text" 
              id="type" 
              v-model="newLine.type" 
              required
              placeholder="e.g., Fillet"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="size">Size</label>
            <input 
              type="text" 
              id="size" 
              v-model="newLine.size" 
              placeholder="e.g., 200-400g"
            />
          </div>

          <div class="form-group">
            <label for="destination">Destination</label>
            <input 
              type="text" 
              id="destination" 
              v-model="newLine.destination" 
              placeholder="e.g., USA"
            />
          </div>
        </div>

        <div class="form-group full-width">
          <label for="comments">Comments</label>
          <textarea 
            id="comments" 
            v-model="newLine.comments" 
            rows="3"
            placeholder="Additional notes..."
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? 'Creating...' : '✓ Create Line' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <!-- Loading State -->
    <div v-if="loading && !showAddForm" class="loading">
      Loading production lines...
    </div>

    <!-- Empty State -->
    <div v-else-if="lines.length === 0 && !loading" class="empty-state">
      No production lines found. Add your first line above!
    </div>

    <!-- Lines Table -->
    <div v-else class="table-container">
      <table class="lines-table">
        <thead>
          <tr>
            <th>Line ID</th>
            <th>Product</th>
            <th>Type</th>
            <th>Size</th>
            <th>Destination</th>
            <th>Comments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in lines" :key="line.line_id" class="line-row">
            <td class="line-id">{{ line.line_id }}</td>
            <td>{{ line.product }}</td>
            <td>{{ line.type }}</td>
            <td>{{ line.size || '-' }}</td>
            <td>{{ line.destination || '-' }}</td>
            <td class="comments">{{ line.comments || '-' }}</td>
            <td>
              <button @click="deleteLine(line.line_id)" class="delete-btn" :disabled="loading">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Stats -->
    <div v-if="lines.length > 0" class="stats">
      <div class="stat-card">
        <div class="stat-value">{{ lines.length }}</div>
        <div class="stat-label">Total Lines</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ uniqueProducts }}</div>
        <div class="stat-label">Different Products</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ uniqueTypes }}</div>
        <div class="stat-label">Different Types</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LinesView',
  data() {
    return {
      lines: [],
      loading: false,
      error: null,
      successMessage: null,
      showAddForm: false,
      newLine: {
        line_id: '',
        product: '',
        type: '',
        size: '',
        destination: '',
        comments: ''
      }
    }
  },
  computed: {
    uniqueProducts() {
      return new Set(this.lines.map(l => l.product)).size
    },
    uniqueTypes() {
      return new Set(this.lines.map(l => l.type)).size
    }
  },
  methods: {
    async fetchLines() {
      this.loading = true
      this.error = null
      try {
        const response = await fetch('/api/lines')
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        const data = await response.json()
        this.lines = data.lines || []
      } catch (err) {
        this.error = `Error loading lines: ${err.message}`
        console.error('Error fetching lines:', err)
      } finally {
        this.loading = false
      }
    },
    async addLine() {
      this.loading = true
      this.error = null
      this.successMessage = null
      
      try {
        const response = await fetch('/api/lines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.newLine)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Error: ${response.status}`)
        }

        const data = await response.json()
        this.successMessage = `✓ Line ${this.newLine.line_id} created successfully!`
        
        // Reset form
        this.newLine = {
          line_id: '',
          product: '',
          type: '',
          size: '',
          destination: '',
          comments: ''
        }
        
        // Refresh list
        await this.fetchLines()
        
        // Hide form after successful creation
        setTimeout(() => {
          this.showAddForm = false
          this.successMessage = null
        }, 2000)
        
      } catch (err) {
        this.error = `Error creating line: ${err.message}`
        console.error('Error adding line:', err)
      } finally {
        this.loading = false
      }
    },
    async deleteLine(lineId) {
      if (!confirm(`Are you sure you want to delete line ${lineId}?`)) {
        return
      }

      this.loading = true
      this.error = null
      
      try {
        const response = await fetch(`/api/lines/${lineId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Error: ${response.status}`)
        }

        this.successMessage = `✓ Line ${lineId} deleted successfully!`
        
        // Refresh list
        await this.fetchLines()
        
        setTimeout(() => {
          this.successMessage = null
        }, 2000)
        
      } catch (err) {
        this.error = `Error deleting line: ${err.message}`
        console.error('Error deleting line:', err)
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    this.fetchLines()
  }
}
</script>

<style scoped lang="scss">
.lines-view {
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

.add-btn {
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;

  &:hover {
    background: #359268;
  }
}

.add-form-card {
  background: white;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;

  h2 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 20px;
  }
}

.line-form {
  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
  }

  .form-group {
    display: flex;
    flex-direction: column;

    &.full-width {
      grid-column: 1 / -1;
    }

    label {
      font-weight: 600;
      margin-bottom: 5px;
      color: #2c3e50;
      font-size: 14px;
    }

    input, textarea {
      padding: 10px;
      border: 1px solid #dee2e6;
      border-radius: 5px;
      font-size: 14px;
      transition: border-color 0.3s;

      &:focus {
        outline: none;
        border-color: #42b983;
      }
    }

    textarea {
      resize: vertical;
      font-family: inherit;
    }
  }

  .form-actions {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .submit-btn {
    padding: 12px 30px;
    background: #42b983;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: background 0.3s;

    &:hover:not(:disabled) {
      background: #359268;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
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

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  border-left: 4px solid #28a745;
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

.lines-table {
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
    .line-row {
      transition: background 0.2s;

      &:hover {
        background: #f8f9fa;
      }

      td {
        padding: 12px 10px;
        border-bottom: 1px solid #dee2e6;
      }

      .line-id {
        font-weight: 600;
        color: #42b983;
      }

      .comments {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .delete-btn {
        padding: 5px 10px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.3s;

        &:hover:not(:disabled) {
          background: #c82333;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

  .line-form .form-row {
    grid-template-columns: 1fr;
  }

  .lines-table {
    font-size: 12px;

    thead th,
    tbody td {
      padding: 8px 5px;
    }
  }
}
</style>
