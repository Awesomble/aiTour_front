import { ref, Ref, CSSProperties } from 'vue'

const useInteractions = (
  zoomLevel: Ref<number>,
  setZoomCooldown: () => void,
  animationKey: Ref<number>
) => {
  const isDragging: Ref<boolean> = ref(false)
  const tiltAngleX: Ref<number> = ref(0)
  const tiltAngleY: Ref<number> = ref(0)
  const dragOffsetX: Ref<number> = ref(0)
  const dragOffsetY: Ref<number> = ref(0)
  const lastMouseX: Ref<number> = ref(0)
  const lastMouseY: Ref<number> = ref(0)
  const returnToCenter: Ref<boolean> = ref(true)

  const maxTilt = 30
  const maxOffset = 100
  const tiltFactor = 0.15
  const dragFactor = 0.2
  const dampingFactor = 0.92

  const radarStyle = (): CSSProperties => ({
    transform: `translate3d(${dragOffsetX.value}px, ${dragOffsetY.value}px, 0) rotateX(${-tiltAngleX.value}deg) rotateY(${tiltAngleY.value}deg)`,
    transformStyle: 'preserve-3d',
    transition: isDragging.value ? 'none' : 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
  })

  const handleMouseDown = (e: MouseEvent): void => {
    isDragging.value = true
    lastMouseX.value = e.clientX
    lastMouseY.value = e.clientY
    returnToCenter.value = false
  }

  const handleMouseMove = (e: MouseEvent): void => {
    if (!isDragging.value) return

    const deltaX = e.clientX - lastMouseX.value
    const deltaY = e.clientY - lastMouseY.value

    tiltAngleY.value += deltaX * tiltFactor
    tiltAngleX.value += deltaY * tiltFactor
    dragOffsetX.value += deltaX * dragFactor
    dragOffsetY.value += deltaY * dragFactor

    tiltAngleY.value = Math.max(Math.min(tiltAngleY.value, maxTilt), -maxTilt)
    tiltAngleX.value = Math.max(Math.min(tiltAngleX.value, maxTilt), -maxTilt)
    dragOffsetX.value = Math.max(Math.min(dragOffsetX.value, maxOffset), -maxOffset)
    dragOffsetY.value = Math.max(Math.min(dragOffsetY.value, maxOffset), -maxOffset)

    lastMouseX.value = e.clientX
    lastMouseY.value = e.clientY
  }

  const animateReturnToCenter = (): void => {
    if (!returnToCenter.value) return

    tiltAngleX.value *= dampingFactor
    tiltAngleY.value *= dampingFactor
    dragOffsetX.value *= dampingFactor
    dragOffsetY.value *= dampingFactor

    if (Math.abs(tiltAngleX.value) < 0.01) tiltAngleX.value = 0
    if (Math.abs(tiltAngleY.value) < 0.01) tiltAngleY.value = 0
    if (Math.abs(dragOffsetX.value) < 0.01) dragOffsetX.value = 0
    if (Math.abs(dragOffsetY.value) < 0.01) dragOffsetY.value = 0

    if (
      tiltAngleX.value === 0 &&
      tiltAngleY.value === 0 &&
      dragOffsetX.value === 0 &&
      dragOffsetY.value === 0
    ) {
      returnToCenter.value = false
      return
    }

    requestAnimationFrame(animateReturnToCenter)
  }

  const handleMouseUp = (): void => {
    isDragging.value = false
    returnToCenter.value = true
    animateReturnToCenter()
  }

  const handleMouseLeave = (): void => {
    if (isDragging.value) handleMouseUp()
  }

  const handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      isDragging.value = true
      lastMouseX.value = e.touches[0].clientX
      lastMouseY.value = e.touches[0].clientY
      returnToCenter.value = false
    }
  }

  const handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault()

    if (e.touches.length === 1) {
      if (isDragging.value) {
        const touch = e.touches[0]
        const deltaX = touch.clientX - lastMouseX.value
        const deltaY = touch.clientY - lastMouseY.value

        tiltAngleY.value += deltaX * tiltFactor
        tiltAngleX.value += deltaY * tiltFactor
        dragOffsetX.value += deltaX * dragFactor
        dragOffsetY.value += deltaY * dragFactor

        tiltAngleY.value = Math.max(Math.min(tiltAngleY.value, maxTilt), -maxTilt)
        tiltAngleX.value = Math.max(Math.min(tiltAngleX.value, maxTilt), -maxTilt)
        dragOffsetX.value = Math.max(Math.min(dragOffsetX.value, maxOffset), -maxOffset)
        dragOffsetY.value = Math.max(Math.min(dragOffsetY.value, maxOffset), -maxOffset)

        lastMouseX.value = touch.clientX
        lastMouseY.value = touch.clientY
      }
    }
  }

  const handleTouchEnd = (e: TouchEvent): void => {
    if (isDragging.value) {
      if (e.touches.length === 0) {
        isDragging.value = false
        returnToCenter.value = true
        animateReturnToCenter()
      }
    }
  }

  return {
    isDragging,
    tiltAngleX,
    tiltAngleY,
    dragOffsetX,
    dragOffsetY,
    radarStyle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}

export default useInteractions