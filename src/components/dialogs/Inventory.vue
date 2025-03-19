<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '@/store/inventoryStore'
import { ArrowUpDown } from 'lucide-vue-next'

// Dialog 상태는 로컬로 관리
const dialog = ref(false)

// 상수
const MAX_ACTIVE_ITEMS = 4
const TOTAL_INVENTORY_SLOTS = 12

// Pinia 스토어 사용 (인벤토리 관리)
const inventoryStore = useInventoryStore()

// 스토어에서 관리하는 활성 아이템 목록 (1단)
const activeItemsList = computed(() => inventoryStore.activeItemsList)
// 스토어에서 관리하는 인벤토리 아이템 (2단: 항상 12 슬롯 유지)
const displayedInventoryItems = computed(() => inventoryStore.displayedInventoryItems)

// 아이템 클릭 핸들러
// 'inventory' 클릭 시 활성 영역(1단)으로 이동, 'active' 클릭 시 인벤토리(2단)로 이동
function handleItemClick(item, source) {
  if (source === 'inventory' && !item.placeholder) {
    inventoryStore.moveToActive(item)
  } else if (source === 'active') {
    inventoryStore.moveToInactive(item)
  }
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="480" content-class="inventory-dialog">
    <v-card flat>
      <v-card-text class="pa-3">
        <!-- Active Items Section (1단) -->
        <div class="section-label">Active Map Items</div>
        <div class="unified-grid active-section">
          <!-- Active items -->
          <div
            v-for="item in activeItemsList"
            :key="item.id"
            class="item-slot has-item"
            @click="handleItemClick(item, 'active')"
          >
            <component :is="item.icon" :size="22" :color="item.color" />
            <div class="item-name">{{ item.name }}</div>
          </div>
          <!-- Empty slots -->
          <div
            v-for="i in MAX_ACTIVE_ITEMS - activeItemsList.length"
            :key="'active-empty-' + i"
            class="item-slot empty-slot"
          >
            <div class="empty-slot-icon">+</div>
          </div>
        </div>

        <!-- 교환 표시 영역 -->
        <div class="trade-indicator mt-2">
          <div class="trade-icon">
            <ArrowUpDown :size="24" color="#1976D2" />
          </div>
        </div>

        <!-- Inventory Items Section (2단) -->
        <div class="section-label">Available Map Items</div>
        <div class="unified-grid inventory-section">
          <!-- Display inventory items (항상 12 슬롯 유지) -->
          <div
            v-for="(item, index) in displayedInventoryItems"
            :key="item.id || 'empty-' + index"
            :class="['item-slot', item.placeholder ? 'empty-slot' : 'inventory-item']"
            @click="handleItemClick(item, 'inventory')"
          >
            <template v-if="!item.placeholder">
              <component :is="item.icon" :size="22" :color="item.color" />
              <div class="item-name">{{ item.name }}</div>
            </template>
            <div v-else class="empty-slot-icon"></div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="dialog = false">Apply</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.inventory-dialog {
  overflow: hidden;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.unified-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-flow: row;
  gap: 8px;
  margin-bottom: 8px;
  width: 100%;
}

/* 교환 표시 영역 스타일 */
.trade-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px 0 12px;
  position: relative;
  height: 30px;
}

.trade-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(25, 118, 210, 0.1);
  border-radius: 50%;
  padding: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  z-index: 2;
}

.trade-arrow {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

.trade-arrow.up {
  left: 35%;
}

.trade-arrow.down {
  right: 35%;
}

/* For overflow control in both sections */
.active-section,
.inventory-section {
  grid-template-rows: auto;
  overflow: hidden;
  max-width: 100%;
}

.item-slot {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 8px;
  background-color: white;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  position: relative;
  border: 1px solid #e0e0e0;
  touch-action: none;
  user-select: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 4px;
}

.item-slot.has-item,
.item-slot.inventory-item {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.item-slot:hover:not(.empty-slot) {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.empty-slot {
  border: 1px dashed #ccc;
  background-color: #f9f9f9;
  cursor: default;
}

.empty-slot-icon {
  color: #ccc;
  font-size: 22px;
  font-weight: 300;
}

.item-name {
  font-size: 10px;
  margin-top: 6px;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}
</style>