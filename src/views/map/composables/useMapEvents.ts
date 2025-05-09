import { ref } from 'vue'

export function useMapEvents(map: any, updateMapInfo: Function, emit: any) {
  // Constants
  const MOVEMENT_DELAY = 200
  const ZOOM_ANIMATION_DELAY = 500

  // State
  let moveEndTimer: number | null = null

  const setupMapEventListeners = () => {
    if (!map.value) return

    // User-initiated drag events
    map.value.addListener('dragend', () => {
      updateMapInfo()
    })

    // Movement detection
    let isMoving = false

    map.value.addListener('center_changed', () => {
      isMoving = true
      if (moveEndTimer) clearTimeout(moveEndTimer)

      moveEndTimer = setTimeout(() => {
        if (isMoving) {
          isMoving = false
          updateMapInfo()
          emit('update:center', {
            lat: map.value.getCenter().lat(),
            lng: map.value.getCenter().lng()
          })
        }
      }, MOVEMENT_DELAY) as unknown as number
    })

    // Zoom events
    map.value.addListener('zoom_changed', () => {
      window.google.maps.event.addListenerOnce(map.value, 'idle', () => {
        const currentZoom = map.value.getZoom()
        emit('update:zoom', currentZoom)
        updateMapInfo()
        console.log('zoom complete, bounds updated')
      })
    })
  }

  const cleanupEventListeners = () => {
    if (moveEndTimer) {
      clearTimeout(moveEndTimer)
      moveEndTimer = null
    }
  }

  return {
    setupMapEventListeners,
    cleanupEventListeners
  }
}