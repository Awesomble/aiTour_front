// store/inventoryStore.ts
import { defineStore } from 'pinia'
import {
  Toilet,
  Camera,
  ShieldCheck,
  Coffee,
  Hotel,
  Landmark,
  Store,
  Utensils,
  Mountain
} from 'lucide-vue-next'

const MAX_ACTIVE_ITEMS = 4
const TOTAL_INVENTORY_SLOTS = 12

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    activeItems: [
      { id: 1, name: 'Restroom', icon: Toilet, color: '#F44336', active: true },
      { id: 2, name: 'Photo Spot', icon: Camera, color: '#2196F3', active: true },
      { id: 3, name: 'Security', icon: ShieldCheck, color: '#4CAF50', active: true },
      { id: null, name: '', icon: null, color: '', active: false }
    ],
    inventoryItems: [
      { id: 5, name: 'Cafe', icon: Coffee, color: '#795548', active: false },
      { id: 6, name: 'Hotel', icon: Hotel, color: '#9C27B0', active: false },
      { id: 7, name: 'Landmark', icon: Landmark, color: '#FF9800', active: false },
      { id: 9, name: 'Store', icon: Store, color: '#E91E63', active: false },
      { id: 10, name: 'Restaurant', icon: Utensils, color: '#FF5722', active: false },
      { id: 12, name: 'Mountain', icon: Mountain, color: '#3F51B5', active: false },
      // 나머지 슬롯은 빈 슬롯으로 초기화하여 총 12칸 유지
      { id: null, name: '', icon: null, color: '', active: false },
      { id: null, name: '', icon: null, color: '', active: false },
      { id: null, name: '', icon: null, color: '', active: false },
      { id: null, name: '', icon: null, color: '', active: false },
      { id: null, name: '', icon: null, color: '', active: false },
      { id: null, name: '', icon: null, color: '', active: false }
    ]
  }),
  getters: {
    activeItemsList: (state) => state.activeItems.filter((item) => item.active && item.id !== null),
    displayedInventoryItems: (state) => {
      const realItems = state.inventoryItems.filter((item) => item.id !== null)
      const itemsToShow = realItems.slice(0, TOTAL_INVENTORY_SLOTS)
      if (itemsToShow.length < TOTAL_INVENTORY_SLOTS) {
        const emptySlots = Array.from(
          { length: TOTAL_INVENTORY_SLOTS - itemsToShow.length },
          (_, i) => ({
            id: `empty-${i}`,
            name: '',
            icon: null,
            color: '',
            placeholder: true
          })
        )
        return [...itemsToShow, ...emptySlots]
      }
      return itemsToShow
    }
  },
  actions: {
    reorderActiveItems() {
      const realItems = this.activeItems.filter((i) => i.id !== null && i.active)
      const emptySlots = Array.from({ length: MAX_ACTIVE_ITEMS - realItems.length }, () => ({
        id: null,
        name: '',
        icon: null,
        color: '',
        active: false
      }))
      this.activeItems = [...realItems, ...emptySlots]
    },
    ensureInventorySlots() {
      const currentLength = this.inventoryItems.length
      if (currentLength < TOTAL_INVENTORY_SLOTS) {
        const additionalSlots = Array.from(
          { length: TOTAL_INVENTORY_SLOTS - currentLength },
          () => ({
            id: null,
            name: '',
            icon: null,
            color: '',
            active: false
          })
        )
        this.inventoryItems = [...this.inventoryItems, ...additionalSlots]
      } else if (currentLength > TOTAL_INVENTORY_SLOTS) {
        this.inventoryItems = this.inventoryItems.slice(0, TOTAL_INVENTORY_SLOTS)
      }
    },
    moveToActive(item: any) {
      // 2단(인벤토리)에서 아이템 클릭 시, 활성 영역(1단)으로 이동하려고 시도함
      if (!item.id || item.placeholder) return

      // 인벤토리에서 아이템 인덱스 찾기
      const itemIndex = this.inventoryItems.findIndex((i) => i.id === item.id)
      if (itemIndex === -1) return

      // 만약 활성 영역이 가득 찼다면 (최대 4개 이상)
      if (this.activeItemsList.length >= MAX_ACTIVE_ITEMS) {
        // 클릭한 아이템은 활성으로 이동하지 않고, 인벤토리의 첫 번째 빈 슬롯에 넣음
        const selectedItem = { ...this.inventoryItems[itemIndex] } // 활성화하지 않음
        // 인벤토리에서 해당 아이템 제거 (빈 슬롯 처리)
        this.inventoryItems[itemIndex] = {
          id: null,
          name: '',
          icon: null,
          color: '',
          active: false
        }
        // 첫 번째 빈 슬롯 찾기
        const emptySlotIndex = this.inventoryItems.findIndex((i) => i.id === null)
        if (emptySlotIndex !== -1) {
          this.inventoryItems[emptySlotIndex] = selectedItem
        } else {
          // 만약 빈 슬롯이 없다면 unshift로 추가
          this.inventoryItems.unshift(selectedItem)
        }
        // 인벤토리 슬롯 수가 총 12개를 초과하면 뒤쪽 슬롯부터 제거
        while (this.inventoryItems.length > TOTAL_INVENTORY_SLOTS) {
          this.inventoryItems.pop()
        }
        this.ensureInventorySlots()
        return
      }

      // 활성 영역이 꽉 차지 않은 경우, 정상적으로 활성화 시킴
      const selectedItem = { ...this.inventoryItems[itemIndex], active: true }
      // 인벤토리에서 아이템 제거 (빈 슬롯 처리)
      this.inventoryItems[itemIndex] = { id: null, name: '', icon: null, color: '', active: false }
      // 활성 영역 맨 앞에 추가 (빈 슬롯 찾아서 앞쪽으로 밀기)
      const emptyActiveIndex = this.activeItems.findIndex((i) => i.id === null)
      if (emptyActiveIndex !== -1) {
        for (let i = emptyActiveIndex; i > 0; i--) {
          this.activeItems[i] = this.activeItems[i - 1]
        }
        this.activeItems[0] = selectedItem
      } else {
        this.activeItems.pop()
        this.activeItems.unshift(selectedItem)
      }
      this.ensureInventorySlots()
      this.reorderActiveItems()
    },
    moveToInactive(item: any) {
      // 1단(활성)에서 아이템 클릭 시, 인벤토리(2단)로 이동
      if (!item.id) return
      const activeIndex = this.activeItems.findIndex((i) => i.id === item.id)
      if (activeIndex === -1) return
      const selectedItem = { ...this.activeItems[activeIndex], active: false }
      this.activeItems[activeIndex] = { id: null, name: '', icon: null, color: '', active: false }
      this.reorderActiveItems()
      // 액티브 영역이 최대(4개)가 넘어가면 이동된 아이템은 인벤토리(2단)의 맨 위에 붙도록 처리
      this.inventoryItems.unshift(selectedItem)
      while (this.inventoryItems.length > TOTAL_INVENTORY_SLOTS) {
        this.inventoryItems.pop()
      }
      this.ensureInventorySlots()
    }
  }
})
