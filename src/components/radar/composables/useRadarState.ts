import { ref, computed, ComputedRef, Ref } from 'vue'

export interface LevelProperties {
  circleCount: number
  circleSpacing: number
  opacityBase: number
  opacityDecrement: number
  circleWidth: number
  displayName: string
}

export interface ContainerSize {
  width: number
  height: number
}

export interface Place {
  place_id: string
  name: string
  latitude: number
  longitude: number
  category?: {
    icon: string
    icon_color: string
  }
  landmark_url?: string
  [key: string]: any
}

const useRadarState = () => {
  const zoomLevel: Ref<number> = ref(1)
  const animationKey: Ref<number> = ref(0)
  const isZoomCooldown: Ref<boolean> = ref(false)
  const placeItems: Ref<Place[]> = ref([])
  const containerSize: Ref<ContainerSize> = ref({ width: 300, height: 300 })

  const levels: Record<number, LevelProperties> = {
    1: {
      circleCount: 2,
      circleSpacing: 130,
      opacityBase: 0.7,
      opacityDecrement: 0.15,
      circleWidth: 1,
      displayName: '1km'
    },
    2: {
      circleCount: 3,
      circleSpacing: 110,
      opacityBase: 0.75,
      opacityDecrement: 0.12,
      circleWidth: 1.5,
      displayName: '2km'
    },
    3: {
      circleCount: 4,
      circleSpacing: 90,
      opacityBase: 0.8,
      opacityDecrement: 0.09,
      circleWidth: 2,
      displayName: '3km'
    }
  }

  const zoomLevelProperties: ComputedRef<LevelProperties> = computed(() => levels[zoomLevel.value])

  const isContainerSizeValid: ComputedRef<boolean> = computed(() =>
    containerSize.value &&
    typeof containerSize.value.width === 'number' &&
    typeof containerSize.value.height === 'number' &&
    containerSize.value.width > 0 &&
    containerSize.value.height > 0
  )

  const setZoomCooldown = (): void => {
    isZoomCooldown.value = true
    setTimeout(() => {
      isZoomCooldown.value = false
    }, 1000)
  }

  const getIconSize = (): number => {
    const baseSizes: Record<number, number> = {
      1: 30,
      2: 26,
      3: 22
    }
    return baseSizes[zoomLevel.value] || 24
  }

  const updateContainerSize = (radarContainer: Ref<HTMLElement | null>): void => {
    if (radarContainer.value) {
      const rect = radarContainer.value.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        containerSize.value = {
          width: rect.width,
          height: rect.height
        }
      }
    }
  }

  return {
    zoomLevel,
    animationKey,
    isZoomCooldown,
    placeItems,
    containerSize,
    levels,
    zoomLevelProperties,
    isContainerSizeValid,
    setZoomCooldown,
    getIconSize,
    updateContainerSize
  }
}

export default useRadarState