<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
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
const tiltAngleX = ref(0) // X축 기울기 (위/아래 움직임)
const tiltAngleY = ref(0) // Y축 기울기 (좌/우 움직임)
const dragOffsetX = ref(0) // X축 드래그 이동 거리
const dragOffsetY = ref(0) // Y축 드래그 이동 거리
const lastMouseX = ref(0)
const lastMouseY = ref(0)
const dampingFactor = 0.92 // 감쇠 계수 (1보다 작을수록 더 빨리 안정화)
const returnToCenter = ref(true) // 손을 놓았을 때 중앙으로 돌아갈지 여부

// 드래그 관련 변수
const maxTilt = 30 // 최대 기울기 각도 (도)
const maxOffset = 100 // 최대 이동 거리 (px)
const tiltFactor = 0.15 // 마우스 움직임에 따른 기울기 변화 계수
const dragFactor = 0.2 // 마우스 움직임에 따른 이동 변화 계수

// 현재 유저 정보
const currentUser = reactive<User>({
  id: 1,
  name: '현재 사용자',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
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

  // 스팟의 위치에 따라 다른 움직임 계수 적용
  // 바깥쪽 스팟은 더 많이 움직이도록 설정
  const moveFactor = spot.radius > 180 ? 0.8 : 0.5

  return {
    position: 'absolute',
    left: `calc(50% + ${Math.cos(radian) * spot.radius - size / 2}px)`,
    top: `calc(50% + ${Math.sin(radian) * spot.radius - size / 2}px)`,
    zIndex: 10,
    transform: `translate3d(${dragOffsetX.value * moveFactor}px, ${dragOffsetY.value * moveFactor}px, 0) rotateX(${-tiltAngleX.value * moveFactor}deg) rotateY(${tiltAngleY.value * moveFactor}deg)`
  }
}

// 레이더 스타일 계산 함수
const radarStyle = () => {
  return {
    transform: `translate3d(${dragOffsetX.value}px, ${dragOffsetY.value}px, 0) rotateX(${-tiltAngleX.value}deg) rotateY(${tiltAngleY.value}deg)`,
    transformStyle: 'preserve-3d',
    transition: isDragging.value ? 'none' : 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
  }
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
  if (tiltAngleX.value === 0 && tiltAngleY.value === 0 &&
    dragOffsetX.value === 0 && dragOffsetY.value === 0) {
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

// 터치 이벤트 핸들러
const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length !== 1) return
  isDragging.value = true
  lastMouseX.value = e.touches[0].clientX
  lastMouseY.value = e.touches[0].clientY
  returnToCenter.value = false
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value || e.touches.length !== 1) return

  // 기본 스크롤 동작 방지
  e.preventDefault()

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

const handleTouchEnd = () => {
  isDragging.value = false
  returnToCenter.value = true
  animateReturnToCenter()
}

const getRadius = async () => {
  const res = await getRadiusAPI(
    globalStore.lat,
    globalStore.long,
    1000,
    1,
    10,
    []
  )
}

// 컴포넌트 마운트 시 이벤트 리스너 등록
onMounted(() => {
  getRadius()
  if (radarContainer.value) {
    radarContainer.value.addEventListener('mousedown', handleMouseDown)
    radarContainer.value.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchend', handleTouchEnd)
    radarContainer.value.addEventListener('mouseleave', handleMouseLeave)
  }
})

// 컴포넌트 언마운트 시 이벤트 리스너 해제
onBeforeUnmount(() => {
  if (radarContainer.value) {
    radarContainer.value.removeEventListener('mousedown', handleMouseDown)
    radarContainer.value.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('touchend', handleTouchEnd)
    radarContainer.value.removeEventListener('mouseleave', handleMouseLeave)
  }
})
</script>

<template>
  <v-container class="discovery-container pa-4">
    <div class="header d-flex justify-space-between align-center mb-4">
      <div class="title">
        <h2 class="text-h5 font-weight-bold">Discover Trending</h2>
        <h2 class="text-h5 font-weight-bold">Checkpoint in Japan</h2>
      </div>
      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </div>

    <div
      class="radar-container"
      ref="radarContainer"
      :style="{ perspective: '1000px' }"
    >
      <div class="radar-inner-container" :style="radarStyle()">
        <!-- 퍼지는 원 애니메이션 -->
        <div
          v-for="(circle, index) in 8"
          :key="`circle-${index}`"
          class="radar-circle"
          :style="{
            animationDelay: `${index * 0.2}s`,
            width: `${(index + 1) * 70}px`,
            height: `${(index + 1) * 70}px`,
            opacity: `${0.9 - index * 0.08}`
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
            <v-img v-if="userStore.userInfo?.thumbnail_url" :src="userStore.userInfo?.thumbnail_url" cover />
            <span v-else class="text-h4">{{ getInitials(String(userStore.userInfo?.user_name)) }}</span>
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
  overflow: visible; /* 오버플로우를 visible로 변경하여 스팟이 컨테이너 밖으로 나갈 수 있도록 함 */
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