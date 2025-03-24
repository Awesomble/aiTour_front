<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useUserStore, useGlobalStore } from '@/store'
import { getInitials } from '@/plugins/utils'
import { getRadiusAPI } from '@/network/app'

interface Spot {
  id: number
  name: string
  image: string
  distance: string
  angle: number
  radius: number
  isFeatured: boolean
}

interface User {
  id: number
  name: string
  avatar: string
}

const userStore = useUserStore()
const globalStore = useGlobalStore()
const radarContainer = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const tiltAngleX = ref(0)
const tiltAngleY = ref(0)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const lastMouseX = ref(0)
const lastMouseY = ref(0)
const dampingFactor = 0.92
const returnToCenter = ref(true)

// 핀치 줌 관련 변수
const zoomLevel = ref(1) // 1-5 사이의 줌 레벨 (1이 가장 넓은 영역)
const isPinching = ref(false)
const pinchStartDistance = ref(0)
const lastPinchDistance = ref(0)
const pinchThreshold = 5 // 더 민감하게 조정

// 쿨다운 및 애니메이션 관련 변수 추가
const isZoomCooldown = ref(false)
const animationKey = ref(0)

// 드래그 관련 변수
const maxTilt = 30
const maxOffset = 100
const tiltFactor = 0.15
const dragFactor = 0.2

// 줌 레벨별 속성 계산
const levels = {
  1: {
    // 가장 넓은 영역, 적은 원
    circleCount: 4,
    circleSpacing: 130,
    radarScale: 1.0, // 스케일이 더이상 변경되지 않음
    spotRadiusMultiplier: 1.8,
    opacityBase: 0.7,
    opacityDecrement: 0.15,
    circleWidth: 1 // 원의 테두리 두께
  },
  2: {
    circleCount: 6,
    circleSpacing: 110,
    radarScale: 1.0,
    spotRadiusMultiplier: 1.4,
    opacityBase: 0.75,
    opacityDecrement: 0.12,
    circleWidth: 1.5
  },
  3: {
    circleCount: 8,
    circleSpacing: 90,
    radarScale: 1.0,
    spotRadiusMultiplier: 1.1,
    opacityBase: 0.8,
    opacityDecrement: 0.09,
    circleWidth: 2
  },
  4: {
    circleCount: 10,
    circleSpacing: 70,
    radarScale: 1.0,
    spotRadiusMultiplier: 0.8,
    opacityBase: 0.85,
    opacityDecrement: 0.07,
    circleWidth: 2.5
  },
  5: {
    // 가장 좁은 영역, 많은 원
    circleCount: 12,
    circleSpacing: 50,
    radarScale: 1.0,
    spotRadiusMultiplier: 0.6,
    opacityBase: 0.9,
    opacityDecrement: 0.05,
    circleWidth: 3
  }
}

const zoomLevelProperties = computed(() => {
  return levels[zoomLevel.value]
})

// 친구 정보
const friends = reactive<User[]>([
  { id: 2, name: 'Joel', avatar: 'https://randomuser.me/api/portraits/men/41.jpg' },
  { id: 3, name: 'Kim', avatar: 'https://randomuser.me/api/portraits/women/63.jpg' },
  { id: 4, name: 'Anna', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 5, name: 'Friend4', avatar: 'https://randomuser.me/api/portraits/men/55.jpg' },
  { id: 6, name: 'Friend5', avatar: 'https://randomuser.me/api/portraits/women/66.jpg' }
])

// 스팟 정보
const spots = reactive<Spot[]>([
  {
    id: 1,
    name: 'Kyoto Local Road',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
    distance: '673 m',
    angle: 30,
    radius: 210,
    isFeatured: true
  },
  {
    id: 2,
    name: 'Arashiyama',
    image: 'https://images.unsplash.com/photo-1493997181344-712f2f19d87a',
    distance: '951 m',
    angle: 150,
    radius: 170,
    isFeatured: false
  },
  {
    id: 3,
    name: 'Daigoji Lake',
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186',
    distance: '690 m',
    angle: 240,
    radius: 190,
    isFeatured: false
  },
  {
    id: 4,
    name: 'Chureito Pagoda',
    image: 'https://images.unsplash.com/photo-1528164344705-47542687000d',
    distance: '992 m',
    angle: 330,
    radius: 220,
    isFeatured: false
  },
  {
    id: 5,
    name: 'Itsukushima',
    image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9',
    distance: '1.8 km',
    angle: 275,
    radius: 260,
    isFeatured: false
  }
])

// 스팟 위치 계산 함수
const calculateSpotPosition = (spot: Spot, index: number) => {
  const radian = (spot.angle * Math.PI) / 180
  const size = spot.isFeatured ? 75 : 45

  // 줌 레벨에 따라 반경 조정
  const adjustedRadius = spot.radius * zoomLevelProperties.value.spotRadiusMultiplier

  // 스팟의 위치에 따라 다른 움직임 계수 적용
  const moveFactor = adjustedRadius > 180 ? 0.8 : 0.5

  return {
    position: 'absolute',
    left: `calc(50% + ${Math.cos(radian) * adjustedRadius - size / 2}px)`,
    top: `calc(50% + ${Math.sin(radian) * adjustedRadius - size / 2}px)`,
    zIndex: 10,
    transform: `translate3d(${dragOffsetX.value * moveFactor}px, ${dragOffsetY.value * moveFactor}px, 0) rotateX(${-tiltAngleX.value * moveFactor}deg) rotateY(${tiltAngleY.value * moveFactor}deg)`
  }
}

// 레이더 스타일 계산 함수
const radarStyle = () => {
  return {
    transform: `translate3d(${dragOffsetX.value}px, ${dragOffsetY.value}px, 0) rotateX(${-tiltAngleX.value}deg) rotateY(${tiltAngleY.value}deg)`,
    transformStyle: 'preserve-3d',
    transition:
      isDragging.value || isPinching.value ? 'none' : 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
  }
}

// 쿨다운 설정 함수 추가
const setZoomCooldown = () => {
  isZoomCooldown.value = true
  setTimeout(() => {
    isZoomCooldown.value = false
  }, 1000) // 1 second cooldown
}
// 드래그 시작 이벤트 핸들러
const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  lastMouseX.value = e.clientX
  lastMouseY.value = e.clientY

  // 애니메이션 프레임 중지
  if (returnToCenter.value) {
    returnToCenter.value = false
  }
}

// 드래그 이벤트 핸들러
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return

  // 마우스 이동 거리 계산
  const deltaX = e.clientX - lastMouseX.value
  const deltaY = e.clientY - lastMouseY.value

  // 기울기 및 이동 거리 업데이트
  tiltAngleY.value += deltaX * tiltFactor
  tiltAngleX.value += deltaY * tiltFactor
  dragOffsetX.value += deltaX * dragFactor
  dragOffsetY.value += deltaY * dragFactor

  // 최대 기울기 및 이동 제한
  tiltAngleY.value = Math.max(Math.min(tiltAngleY.value, maxTilt), -maxTilt)
  tiltAngleX.value = Math.max(Math.min(tiltAngleX.value, maxTilt), -maxTilt)
  dragOffsetX.value = Math.max(Math.min(dragOffsetX.value, maxOffset), -maxOffset)
  dragOffsetY.value = Math.max(Math.min(dragOffsetY.value, maxOffset), -maxOffset)

  // 마지막 마우스 위치 업데이트
  lastMouseX.value = e.clientX
  lastMouseY.value = e.clientY
}

// 드래그 종료 이벤트 핸들러
const handleMouseUp = () => {
  isDragging.value = false

  // 중앙으로 돌아가는 애니메이션 시작
  returnToCenter.value = true
  animateReturnToCenter()
}

// 중앙으로 돌아가는 애니메이션
const animateReturnToCenter = () => {
  if (!returnToCenter.value) return

  // 기울기 및 이동 거리를 점진적으로 0으로 감소시킴
  tiltAngleX.value *= dampingFactor
  tiltAngleY.value *= dampingFactor
  dragOffsetX.value *= dampingFactor
  dragOffsetY.value *= dampingFactor

  // 값이 매우 작아지면 0으로 설정
  if (Math.abs(tiltAngleX.value) < 0.01) tiltAngleX.value = 0
  if (Math.abs(tiltAngleY.value) < 0.01) tiltAngleY.value = 0
  if (Math.abs(dragOffsetX.value) < 0.01) dragOffsetX.value = 0
  if (Math.abs(dragOffsetY.value) < 0.01) dragOffsetY.value = 0

  // 모든 값이 0이 되면 애니메이션 중지
  if (
    tiltAngleX.value === 0 &&
    tiltAngleY.value === 0 &&
    dragOffsetX.value === 0 &&
    dragOffsetY.value === 0
  ) {
    returnToCenter.value = false
    return
  }

  // 다음 프레임 요청
  requestAnimationFrame(animateReturnToCenter)
}

// 마우스가 레이더 영역을 떠날 경우 드래그 종료
const handleMouseLeave = () => {
  if (isDragging.value) {
    handleMouseUp()
  }
}

// 마우스 휠 이벤트 핸들러 추가 (데스크톱 테스트용)
const handleMouseWheel = (e: WheelEvent) => {
  e.preventDefault()

  // 쿨다운 중인 경우 무시
  if (isZoomCooldown.value) {
    return
  }

  // 휠 방향에 따라 줌 레벨 조정
  if (e.deltaY > 0) {
    // 휠 다운 - 줌 아웃 (레벨 감소)
    if (zoomLevel.value > 1) {
      zoomLevel.value--
      setZoomCooldown()
      animationKey.value++
    }
  } else {
    // 휠 업 - 줌 인 (레벨 증가)
    if (zoomLevel.value < 5) {
      zoomLevel.value++
      setZoomCooldown()
      animationKey.value++
    }
  }
}

// 키보드 이벤트 핸들러 추가 (데스크톱 테스트용)
const handleKeyDown = (e: KeyboardEvent) => {
  // 쿨다운 중인 경우 무시
  if (isZoomCooldown.value) {
    return
  }

  // +, = 키로 줌 인
  if (e.key === '+' || e.key === '=') {
    if (zoomLevel.value < 5) {
      zoomLevel.value++
      setZoomCooldown()
      animationKey.value++
    }
  }
  // - 키로 줌 아웃
  else if (e.key === '-' || e.key === '_') {
    if (zoomLevel.value > 1) {
      zoomLevel.value--
      setZoomCooldown()
      animationKey.value++
    }
  }
}

// 터치 이벤트 핸들러 (핀치 줌 기능 개선)
const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) {
    // 단일 터치 - 드래그로 처리
    isDragging.value = true
    isPinching.value = false
    lastMouseX.value = e.touches[0].clientX
    lastMouseY.value = e.touches[0].clientY
    returnToCenter.value = false
  } else if (e.touches.length === 2) {
    // 핀치 제스처 시작 - 초기 거리 계산
    isDragging.value = false
    isPinching.value = true

    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    pinchStartDistance.value = Math.sqrt(dx * dx + dy * dy)
    lastPinchDistance.value = pinchStartDistance.value

    console.log('핀치 시작:', pinchStartDistance.value)
  }
}

// 핀치 이벤트 핸들러 수정
const handleTouchMove = (e: TouchEvent) => {
  // 기본 스크롤 동작 방지
  e.preventDefault()

  if (e.touches.length === 2) {
    // 핀칭 모드
    isPinching.value = true
    isDragging.value = false

    // 핀치 거리 계산
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const currentDistance = Math.sqrt(dx * dx + dy * dy)

    // 시작 거리가 0이면 초기화
    if (pinchStartDistance.value === 0) {
      pinchStartDistance.value = currentDistance
      lastPinchDistance.value = currentDistance
      return
    }

    // 핀치 거리 변화 확인
    const pinchChange = currentDistance - lastPinchDistance.value
    console.log(
      `[PINCH DEBUG] currentDistance: ${currentDistance}, lastPinchDistance: ${lastPinchDistance.value}, pinchChange: ${pinchChange}, threshold: ${pinchThreshold}, current zoomLevel: ${zoomLevel.value}`
    )

    // 핀치 거리에 따라 줌 레벨 조정 (쿨다운 확인)
    if (Math.abs(pinchChange) > pinchThreshold && !isZoomCooldown.value) {
      if (pinchChange > 0) {
        // 핀치 아웃 - 줌 아웃 (레벨 감소 = 영역 확대)
        console.log(
          `[PINCH ACTION] Pinch out detected. Current zoomLevel before: ${zoomLevel.value}`
        )
        if (zoomLevel.value > 1) {
          zoomLevel.value--
          setZoomCooldown() // 쿨다운 적용
          animationKey.value++ // 애니메이션 초기화
          console.log(`[PINCH ACTION] Zoom out executed. New zoomLevel: ${zoomLevel.value}`)
        } else {
          console.log('[PINCH ACTION] Zoom level already at minimum.')
        }
      } else if (pinchChange < 0) {
        // 핀치 인 - 줌 인 (레벨 증가 = 영역 축소)
        console.log(
          `[PINCH ACTION] Pinch in detected. Current zoomLevel before: ${zoomLevel.value}`
        )
        if (zoomLevel.value < 5) {
          zoomLevel.value++
          setZoomCooldown() // 쿨다운 적용
          animationKey.value++ // 애니메이션 초기화
          console.log(`[PINCH ACTION] Zoom in executed. New zoomLevel: ${zoomLevel.value}`)
        } else {
          console.log('[PINCH ACTION] Zoom level already at maximum.')
        }
      }
      // 다음 비교를 위해 현재 거리 저장
      lastPinchDistance.value = currentDistance
    }
  } else if (e.touches.length === 1) {
    // 드래그 모드로 전환
    if (isPinching.value) {
      isPinching.value = false
      pinchStartDistance.value = 0
      lastPinchDistance.value = 0
      isDragging.value = true
      lastMouseX.value = e.touches[0].clientX
      lastMouseY.value = e.touches[0].clientY
    }

    if (isDragging.value) {
      // 단일 터치 드래그 처리
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

const handleTouchEnd = (e: TouchEvent) => {
  if (isPinching.value) {
    if (e.touches.length < 2) {
      isPinching.value = false
      console.log('핀치 종료')
    }
  }

  if (isDragging.value) {
    if (e.touches.length === 0) {
      isDragging.value = false
      returnToCenter.value = true
      animateReturnToCenter()
    }
  }
}

const getRadius = async () => {
  const zoomToRadius = {
    1: 1500,
    2: 1000,
    3: 700,
    4: 500,
    5: 300
  }
  const radius = zoomToRadius[zoomLevel.value]
  try {
    const res = await getRadiusAPI(globalStore.lat, globalStore.long, radius, 1, 10, [])
    if (res && res.data) {
      console.log('getRadius: res.data type:', typeof res.data, res.data)
      let newSpots
      if (Array.isArray(res.data)) {
        newSpots = res.data
      } else if (res.data && typeof res.data[Symbol.iterator] === 'function') {
        newSpots = Array.from(res.data)
      } else {
        newSpots = [res.data]
      }
      spots.splice(0, spots.length, ...newSpots)
    }
  } catch (error) {
    console.error('Error fetching radius data:', error)
  }
}

// 컴포넌트 마운트 시 이벤트 리스너 등록
onMounted(() => {
  getRadius()
  if (radarContainer.value) {
    radarContainer.value.addEventListener('mousedown', handleMouseDown)
    radarContainer.value.addEventListener('touchstart', handleTouchStart, { passive: false })
    radarContainer.value.addEventListener('wheel', handleMouseWheel, { passive: false }) // 마우스 휠 이벤트 추가
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchend', handleTouchEnd)
    radarContainer.value.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('keydown', handleKeyDown) // 키보드 이벤트 추가
  }
})

// 줌 레벨 변경 시 반경 API 재호출
watch(zoomLevel, () => {
  getRadius()
})

// 컴포넌트 언마운트 시 이벤트 리스너 해제
onBeforeUnmount(() => {
  if (radarContainer.value) {
    radarContainer.value.removeEventListener('mousedown', handleMouseDown)
    radarContainer.value.removeEventListener('touchstart', handleTouchStart)
    radarContainer.value.removeEventListener('wheel', handleMouseWheel) // 마우스 휠 이벤트 제거
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('touchend', handleTouchEnd)
    radarContainer.value.removeEventListener('mouseleave', handleMouseLeave)
    window.removeEventListener('keydown', handleKeyDown) // 키보드 이벤트 제거
  }
})
</script>

<template>
  <v-container class="discovery-container pa-4">
    <div class="header d-flex justify-space-between align-center mb-4">
      <div class="title">
        <h2 class="text-h6 font-weight-bold">What's poppin' within {{ zoomLevel }}km</h2>
        <h2 class="text-h6 font-weight-bold">Let's hit the hottest spots near you.</h2>
      </div>
    </div>

    <div class="radar-container" ref="radarContainer" :style="{ perspective: '1000px' }">
      <div class="radar-inner-container" :style="radarStyle()">
        <!-- 퍼지는 원 애니메이션 - 줌 레벨에 따라 동적 조정 -->
        <div
          v-for="index in zoomLevelProperties.circleCount"
          :key="`circle-${index}-${animationKey}`"
          class="radar-circle"
          :style="{
            animationDelay: `${index * 0.2}s`,
            width: `${(index + 1) * zoomLevelProperties.circleSpacing}px`,
            height: `${(index + 1) * zoomLevelProperties.circleSpacing}px`,
            opacity: `${zoomLevelProperties.opacityBase - index * zoomLevelProperties.opacityDecrement}`,
            borderWidth: `${zoomLevelProperties.circleWidth}px`
          }"
        ></div>

        <!-- 디자인 강화용 추가 레이더 효과 -->
        <div class="radar-scan"></div>

        <!-- 레이더 센터 포인트 -->
        <div class="radar-center-point"></div>
        <div class="radar-center-point-outer"></div>

        <!-- 중앙 유저 썸네일 -->
        <div class="user-thumbnail">
          <v-avatar size="60">
            <v-img
              v-if="userStore.userInfo?.thumbnail_url"
              :src="userStore.userInfo?.thumbnail_url"
              cover
            />
            <span v-else class="text-h4">{{
              getInitials(String(userStore.userInfo?.user_name))
            }}</span>
          </v-avatar>
        </div>
      </div>

      <!-- 주변 스팟들 -->
      <div
        v-for="(spot, index) in spots"
        :key="`spot-${index}`"
        class="spot-item"
        :style="calculateSpotPosition(spot, index)"
      >
        <div class="speech-bubble">
          <v-card
            class="spot-card"
            :width="spot.isFeatured ? 150 : 90"
            :height="spot.isFeatured ? 80 : 60"
            elevation="3"
            rounded="lg"
          >
            <v-img :src="spot.image" height="100%" cover class="spot-image">
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
                </v-row>
              </template>
              <div class="spot-overlay d-flex flex-column justify-space-between pa-2">
                <div class="spot-name font-weight-bold text-caption">{{ spot.name }}</div>
                <div class="d-flex justify-space-between align-center">
                  <div class="spot-distance text-caption">
                    <v-icon size="x-small" color="white">mdi-map-marker</v-icon>
                    {{ spot.distance }}
                  </div>
                  <v-btn
                    v-if="spot.isFeatured"
                    color="error"
                    variant="flat"
                    density="compact"
                    size="x-small"
                    class="text-none"
                  >
                    <v-icon size="x-small">mdi-navigation</v-icon>
                    Get Direction
                  </v-btn>
                </div>
              </div>
            </v-img>
          </v-card>
          <div class="speech-pointer"></div>
        </div>
      </div>
    </div>

    <!-- 줌 레벨 인디케이터 (현대적 디자인) -->
    <!-- 개선된 줌 레벨 인디케이터 템플릿 부분 -->
    <div class="zoom-indicator-container mt-4">
      <!-- 줌 레벨 트랙 및 프로그레스 개선 - 게이지와 닷 정렬 수정 -->
      <div class="zoom-level-track">
        <div
          class="zoom-level-progress"
          :style="{ width: `${((zoomLevel - 1) / 4) * 100}%` }"
        ></div>
        <div
          v-for="level in 5"
          :key="`marker-${level}`"
          class="zoom-level-marker"
          :class="{ active: level <= zoomLevel }"
          :style="{ left: `${((level - 1) / 4) * 100}%` }"
        >
          <div class="zoom-level-dot"></div>
          <div class="zoom-level-pulse" v-if="level === zoomLevel"></div>
        </div>
      </div>

      <!-- 시각적 줌 레벨 인디케이터로 교체 -->
      <div class="zoom-level-visual-indicator">
        <div class="radar-icon-container">
          <div class="zoom-level-name">
            {{ ['매우 좁음', '좁음', '보통', '넓음', '매우 넓음'][zoomLevel - 1] }}
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 친구 정보 -->
    <div class="friends-info mt-4 d-flex align-center">
      <div class="friends-avatars d-flex">
        <v-avatar
          v-for="(friend, index) in friends"
          :key="`friend-${index}`"
          :size="32"
          class="friend-avatar"
          :style="{ zIndex: friends.length - index }"
        >
          <v-img :src="friend.avatar" alt="Friend"></v-img>
        </v-avatar>
      </div>
      <div class="friends-text ml-2">
        <span class="font-weight-bold">{{ friends[0].name }}, {{ friends[1].name }}</span> and
        {{ friends.length - 2 }} Friends was in this area.
      </div>
    </div>
  </v-container>
</template>

<style scoped>
.discovery-container {
  position: relative;
  background-color: #f5f7fa;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #eef3f8 100%);
  border-radius: 24px;
  overflow: visible; /* 스팟이 밖으로 나갈 수 있도록 변경 */
  max-width: 480px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  padding-bottom: 120px; /* 더 많은 여백 추가 */
}

.radar-container {
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: grab;
  overflow: visible;
  user-select: none;
}

.radar-container:active {
  cursor: grabbing;
}

.radar-inner-container {
  position: relative;
  width: 100%;
  height: 100%;
  will-change: transform;
}

.radar-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(100, 150, 255, 0.4);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 4s infinite cubic-bezier(0.4, 0, 0.2, 1);
  background: none;
  backdrop-filter: blur(1px);
}

.radar-scan {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 550px;
  height: 550px;
  background: conic-gradient(rgba(120, 180, 255, 0.3), transparent 240deg, transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: rotate 6s linear infinite;
  opacity: 0.2;
  z-index: 5;
  backdrop-filter: blur(0.5px);
}

.radar-center-point {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  background-color: rgba(100, 170, 255, 0.8);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 15px rgba(100, 170, 255, 0.6);
  z-index: 8;
  animation: pulse-center 1.5s ease-in-out infinite;
}

.radar-center-point-outer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  border: 1.5px solid rgba(100, 170, 255, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 7;
  animation: pulse-outer 3s ease-in-out infinite;
}

/* 새로운 줌 레벨 인디케이터 스타일 */
/* 개선된 줌 레벨 인디케이터 스타일 */
.zoom-indicator-container {
  width: 100%;
  padding: 0 20px;
  margin-bottom: 15px;
}

/* 게이지바 및 닷 정렬 수정 */
.zoom-level-track {
  position: relative;
  height: 4px;
  background-color: rgba(100, 150, 255, 0.2);
  border-radius: 2px;
  margin-bottom: 8px;
}

.zoom-level-progress {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, rgba(100, 150, 255, 0.5), rgba(100, 170, 255, 0.9));
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.zoom-level-marker {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.zoom-level-dot {
  width: 8px;
  height: 8px;
  background-color: rgba(100, 150, 255, 0.3);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.zoom-level-marker.active .zoom-level-dot {
  background-color: rgba(100, 150, 255, 0.9);
  box-shadow: 0 0 10px rgba(100, 150, 255, 0.5);
}

.zoom-level-pulse {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: rgba(100, 150, 255, 0.2);
  animation: pulse-marker 2s infinite;
}

/* 시각적 줌 레벨 인디케이터 스타일 */
.zoom-level-visual-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
}

.radar-icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.zoom-level-name {
  color: rgba(80, 120, 200, 1);
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 0 10px rgba(100, 150, 255, 0.3);
  text-align: center;
  transition: all 0.3s ease;
}

.radar-icon {
  position: relative;
  width: 40px;
  height: 40px;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.radar-icon.active {
  opacity: 1;
}

.radar-icon-circle {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(100, 150, 255, 0.7);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.radar-icon-wide .radar-icon-circle {
  border-color: rgba(100, 180, 255, 0.7);
}

.radar-icon-narrow .radar-icon-circle {
  border-color: rgba(100, 130, 210, 0.7);
}

.radar-icon-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: rgba(100, 150, 255, 0.9);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 5px rgba(100, 150, 255, 0.5);
}

/* 넓은 영역 아이콘의 원 크기 */
.radar-icon-wide .circle-wide-1 {
  width: 36px;
  height: 36px;
}

.radar-icon-wide .circle-wide-2 {
  width: 26px;
  height: 26px;
}

.radar-icon-wide .circle-wide-3 {
  width: 16px;
  height: 16px;
}

/* 좁은 영역 아이콘의 원 크기 */
.radar-icon-narrow .circle-narrow-1 {
  width: 16px;
  height: 16px;
}

.radar-icon-narrow .circle-narrow-2 {
  width: 26px;
  height: 26px;
}

.radar-icon-narrow .circle-narrow-3 {
  width: 36px;
  height: 36px;
}

@keyframes pulse-marker {
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  70% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

@keyframes pulse-outer {
  0% {
    width: 24px;
    height: 24px;
    opacity: 0.8;
  }
  50% {
    width: 28px;
    height: 28px;
    opacity: 0.5;
  }
  100% {
    width: 24px;
    height: 24px;
    opacity: 0.8;
  }
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.95);
    opacity: 0.7;
  }
  65% {
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

@keyframes rotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes pulse-center {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
}

.user-thumbnail {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(100, 170, 255, 0.4);
  animation: float 3s ease-in-out infinite;
}

.user-thumbnail::after {
  content: '';
  position: absolute;
  width: 68px;
  height: 68px;
  top: -4px;
  left: -4px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  animation: pulse-user 3s infinite alternate;
}

@keyframes pulse-user {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.1);
    opacity: 0.2;
  }
}

@keyframes float {
  0% {
    transform: translate(-50%, -50%) translateY(0px);
    box-shadow: 0 0 15px rgba(100, 150, 255, 0.5);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-8px);
    box-shadow: 0 15px 20px rgba(100, 150, 255, 0.3);
  }
  100% {
    transform: translate(-50%, -50%) translateY(0px);
    box-shadow: 0 0 15px rgba(100, 150, 255, 0.5);
  }
}

.speech-bubble {
  position: relative;
  display: inline-block;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08));
}

.speech-pointer {
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid white;
  position: absolute;
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%);
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.05));
}

.spot-card {
  overflow: hidden;
  transition: all 0.3s ease;
  border-radius: 12px !important;
  backdrop-filter: blur(1px);
}

.spot-card:hover {
  transform: translateY(-5px) scale(1.03);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
}

.spot-image {
  position: relative;
}

.spot-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2) 60%, rgba(0, 0, 0, 0));
  color: white;
  height: 100%;
  backdrop-filter: blur(1px);
}

.spot-name {
  font-size: 14px;
  line-height: 1.2;
}

.spot-distance {
  font-size: 12px;
  display: flex;
  align-items: center;
}

.friends-avatars {
  display: flex;
  margin-right: 5px;
}

.friend-avatar {
  margin-left: -8px;
  border: 2px solid white;
}

.friends-text {
  font-size: 14px;
  color: #555;
}

.spot-item {
  transition: transform 0.1s ease-out;
  will-change: transform;
}
</style>
