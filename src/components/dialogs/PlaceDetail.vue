
<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlacesDetailAPI } from '@/network/app' // API 호출 함수
import { useGlobalStore, useMapStore } from '@/store' // 전역 상태 관리
import PlaceHeader from '@/components/place/PlaceHeader.vue' // 장소 헤더 컴포넌트
import PlacePhotos from '@/components/place/PlacePhotos.vue' // 장소 사진 컴포넌트
import InfoPanel from '@/components/place/InfoPanel.vue' // 정보 패널 컴포넌트
import ChatPanel from '@/components/place/ChatPanel.vue' // 채팅 패널 컴포넌트
import { formatDistance } from '@/plugins/utils' // 거리 포맷팅 유틸리티
import { Navigation } from 'lucide-vue-next' // 네비게이션 아이콘

// --- Props & Emits ---
const props = defineProps({
  modelValue: {
    // v-model 바인딩을 위한 prop (팝업 표시 여부)
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:modelValue']) // v-model 업데이트 이벤트

// --- 기본 상태 ---
const route = useRoute() // Vue Router의 현재 라우트 정보
const router = useRouter() // Vue Router 인스턴스
const dialog = ref(false) // 팝업 표시 여부 내부 상태
const detail = ref<any>(null) // 장소 상세 정보 데이터
const loading = ref(true) // 데이터 로딩 상태
const containerRef = ref<HTMLElement | null>(null) // 팝업 컨테이너 DOM 참조
const contentRef = ref<HTMLElement | null>(null) // 콘텐츠 영역 DOM 참조
const dragHandleRef = ref<HTMLElement | null>(null) // 드래그 핸들 DOM 참조
const globalStore = useGlobalStore() // 전역 상태 저장소
const mapStore = useMapStore() // 지도 관련 상태 저장소

// --- 높이 상태 관리 ---
const MIN_HEIGHT = 150 // 최소 높이 (px)
const MID_HEIGHT = 300 // 중간 높이 (px)
const MAX_HEIGHT = window.innerHeight - 50 // 최대 높이 (px, 화면 높이 기반)
const currentHeight = ref(MIN_HEIGHT) // 현재 팝업 높이 (동적 변경)
const CLOSE_DRAG_THRESHOLD = 50 // 최소 높이에서 아래로 드래그하여 닫기 위한 임계값 (px)
const MIN_DRAG_VISUAL_LIMIT = 60 // 최소 높이에서 아래로 드래그 시 시각적으로 내려가는 최대 거리 (px)

// --- 채팅 팝업 상태 ---
const showChatPopup = ref(false) // 채팅 팝업 표시 여부

// --- 드래그 상태 관리 ---
const isDragging = ref(false) // 현재 드래그 중인지 여부
const startY = ref(0) // 드래그 시작 시점의 Y 좌표
const startHeight = ref(0) // 드래그 시작 시점의 팝업 높이
const rawDragDelta = ref(0) // 드래그 이동 거리 (raw 값, 양수: 위로, 음수: 아래로)
const dragThreshold = 5 // 드래그로 간주하기 위한 최소 이동 픽셀
const isClosingDrag = ref(false) // 최소 높이에서 아래로 드래그하여 닫는 동작 중인지 여부

// --- Computed 속성 ---

// 현재 높이 상태 ('min', 'mid', 'max') 계산
const heightState = computed(() => {
  if (currentHeight.value <= (MIN_HEIGHT + MID_HEIGHT) / 2) return 'min'
  if (currentHeight.value <= (MID_HEIGHT + MAX_HEIGHT) / 2) return 'mid'
  return 'max'
})

// 팝업이 최대 높이인지 확인 (사진 클릭 가능 여부 결정)
const isMaxHeight = computed(() => {
  return heightState.value === 'max'
})

// 콘텐츠 영역이 스크롤 가능한지 확인 (최대 높이일 때만 가능)
const isScrollable = computed(() => {
  return heightState.value === 'max'
})

// --- 내부 함수 ---

// 콘텐츠 영역이 스크롤 상단에 있는지 확인
const isAtTopScroll = () => {
  if (!contentRef.value) return true
  return contentRef.value.scrollTop <= 1 // 약간의 오차 허용
}

// 콘텐츠 영역에 스크롤 가능한 콘텐츠가 있는지 확인
const hasScrollableContent = () => {
  if (!contentRef.value) return false
  return contentRef.value.scrollHeight > contentRef.value.clientHeight
}

// 장소 상세 정보 API 호출
const getPlaceDetail = async () => {
  const placeId: string = route.query.place as string
  if (!placeId) return // placeId 없으면 중단

  try {
    loading.value = true
    const res = await getPlacesDetailAPI(placeId, globalStore.lat, globalStore.lng)
    if (res.status === 200) {
      detail.value = res.data // 성공 시 데이터 저장
    }
  } catch (error) {
    console.error('Error fetching place details:', error)
  } finally {
    loading.value = false // 로딩 상태 해제
  }
}

// --- 드래그 관련 변수 및 함수 ---

const isScrollingContent = ref(false) // 사용자가 콘텐츠 스크롤 중인지 여부
const touchStartY = ref(0) // 터치 시작 Y 좌표 (스크롤/드래그 구분용)
let touchMoveCount = 0 // 터치 이동 이벤트 카운트 (초기 구분용)

// 콘텐츠 영역 터치 시작 핸들러 (스크롤 vs 드래그 구분)
const handleContentTouchStart = (e: TouchEvent) => {
  isScrollingContent.value = false
  touchStartY.value = e.touches[0].clientY
  touchMoveCount = 0

  // 최대 높이이고, 스크롤 가능하며, 스크롤이 상단이 아닐 때는 스크롤로 간주
  if (isMaxHeight.value && hasScrollableContent() && !isAtTopScroll()) {
    return // 스크롤 동작을 위해 여기서 중단
  }

  // 그 외의 경우, 드래그 시작 준비
  startManualDrag(e)
}

// 콘텐츠 영역 마우스 다운 핸들러
const handleContentMouseDown = (e: MouseEvent) => {
  // 최대 높이이고, 스크롤 가능하며, 스크롤이 상단이 아닐 때는 스크롤로 간주
  if (isMaxHeight.value && hasScrollableContent() && !isAtTopScroll()) {
    return // 스크롤 동작을 위해 여기서 중단
  }

  // 그 외의 경우, 드래그 시작
  startManualDrag(e)
}

// 드래그 핸들 마우스/터치 시작 핸들러
const handleDragStart = (e: MouseEvent | TouchEvent) => {
  e.stopPropagation() // 이벤트 버블링 방지
  startManualDrag(e)
}

// 드래그 시작 공통 로직
const startManualDrag = (e: MouseEvent | TouchEvent) => {
  // 터치 이벤트는 기본 스크롤 동작을 막지 않음 (스크롤 가능성)
  // 마우스 이벤트는 기본 동작(텍스트 선택 등) 방지
  if (e.type === 'mousedown') {
    e.preventDefault()
  }

  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  isDragging.value = true
  isClosingDrag.value = false // 닫기 드래그 상태 초기화
  startY.value = clientY
  startHeight.value = currentHeight.value

  // 드래그 시작 시 transition 제거 (부드러운 이동 방해 방지)
  if (containerRef.value) {
    containerRef.value.style.transition = 'none'
    // 기존 transform 스타일 초기화 (중요)
    containerRef.value.style.transform = ''
  }

  // document 레벨에 이벤트 리스너 추가 (팝업 밖에서도 드래그 가능하도록)
  document.addEventListener('mousemove', onManualDrag)
  document.addEventListener('touchmove', onManualDrag, { passive: false }) // passive: false 로 스크롤 방지 가능하게
  document.addEventListener('mouseup', endManualDrag)
  document.addEventListener('touchend', endManualDrag)
}

// 드래그 중 이벤트 핸들러
const onManualDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return // 드래그 중이 아니면 중단

  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  // currentRawDelta: 시작점 기준 이동 거리 (양수: 위로, 음수: 아래로)
  const currentRawDelta = startY.value - clientY
  rawDragDelta.value = currentRawDelta // 최종 계산 위해 저장

  // --- 터치 이벤트 처리: 스크롤 vs 드래그 구분 ---
  if ('touches' in e) {
    touchMoveCount++
    // Case A: 최대 높이 + 스크롤 가능 상태
    if (isMaxHeight.value && hasScrollableContent()) {
      const touchDeltaY = clientY - touchStartY.value // 터치 시작점 기준 이동 거리
      // 스크롤이 상단인데 아래로 당기거나(deltaY > 0), 드래그 임계값 이상 움직였을 때
      if (
        (isAtTopScroll() && touchDeltaY > dragThreshold) ||
        (!isAtTopScroll() && Math.abs(touchDeltaY) > dragThreshold)
      ) {
        // 초반 몇 번의 move 이벤트는 스크롤 방지 (드래그 시작 가능성)
        if (touchMoveCount <= 3 && isAtTopScroll() && touchDeltaY > 0) {
          e.preventDefault() // 브라우저 기본 스크롤 방지 (아래로 당기기)
        } else if (!isAtTopScroll()) {
          // 스크롤 중일 때는 preventDefault 안함
        } else {
          // 드래그로 간주될 수 있는 상황 (상단에서 아래로 당김)
          e.preventDefault()
        }
      } else if (isAtTopScroll() && touchDeltaY <= 0) {
        // 상단에서 위로 스크롤하려는 경우 -> 드래그로 처리될 수 있도록 preventDefault
        e.preventDefault()
      } else {
        // 스크롤 의도로 판단되면 드래그 중단 (상단 아니고 위/아래 작은 움직임)
        isScrollingContent.value = true
        // isDragging.value = false; // end에서 처리
        return
      }
    }
    // Case B: 최소 높이에서 아래로 당길 때 (닫기 제스처)
    else if (startHeight.value === MIN_HEIGHT && currentRawDelta < 0) {
      e.preventDefault() // 브라우저 기본 스크롤/액션 방지
    }
    // Case C: 기타 터치 드래그 상황 (높이 조절)
    else {
      e.preventDefault() // 일반 드래그 시 스크롤 방지
    }
  }
  // --- 마우스 이벤트 처리 ---
  else {
    // 마우스 이벤트는 항상 preventDefault (텍스트 선택 등 방지)
    e.preventDefault()
  }

  // 스크롤 중이면 드래그 로직 실행 안 함
  if (isScrollingContent.value) return

  // --- 드래그 로직 실행 ---
  if (containerRef.value) {
    // Case 1: 최소 높이에서 아래로 드래그 (닫기 제스처)
    if (startHeight.value === MIN_HEIGHT && currentRawDelta < 0) {
      isClosingDrag.value = true // 닫기 드래그 상태 활성화
      // 시각적 이동 효과: 아래로 당긴 만큼 translateY 적용 (제한 포함)
      // currentRawDelta는 음수이므로 -currentRawDelta는 양수(아래로 이동량)
      const visualTranslateY = Math.min(-currentRawDelta, MIN_DRAG_VISUAL_LIMIT)

      // 오퍼시티 계산: 드래그 거리에 비례하여 1.0부터 0.1까지 감소
      // visualTranslateY가 0일 때 opacity = 1, MIN_DRAG_VISUAL_LIMIT일 때 opacity = 0.1
      const opacity = 1 - (visualTranslateY / MIN_DRAG_VISUAL_LIMIT) * 0.9

      containerRef.value.style.height = `${MIN_HEIGHT}px` // 높이는 고정
      containerRef.value.style.setProperty('transform', `translateY(${visualTranslateY}px)`, 'important') // 계산된 값만큼 아래로 이동
      containerRef.value.style.opacity = opacity.toString() // 오퍼시티 적용
      currentHeight.value = MIN_HEIGHT // 논리적 높이는 최소 유지
    }
    // Case 2: 일반적인 높이 조절 드래그 (위로 올리거나, 중간/최대 높이에서 드래그)
    else {
      isClosingDrag.value = false // 닫기 드래그 상태 비활성화
      // 새 높이 계산 (MIN과 MAX 사이로 제한)
      const newHeight = Math.max(
        MIN_HEIGHT,
        Math.min(MAX_HEIGHT, startHeight.value + currentRawDelta)
      )
      containerRef.value.style.height = `${newHeight}px` // 높이 적용
      containerRef.value.style.transform = 'translateY(0)' // transform 초기화 (혹시 남아있을 수 있으므로)
      currentHeight.value = newHeight // 논리적 높이 업데이트
    }
  }
}

// 드래그 종료 핸들러
const endManualDrag = () => {
  // 드래그/스크롤 중 아니었으면 또는 container 없으면 중단
  if ((!isDragging.value && !isScrollingContent.value) || !containerRef.value) {
    // 혹시 모를 리스너 잔존 제거 시도
    document.removeEventListener('mousemove', onManualDrag)
    document.removeEventListener('touchmove', onManualDrag)
    document.removeEventListener('mouseup', endManualDrag)
    document.removeEventListener('touchend', endManualDrag)
    isDragging.value = false
    isScrollingContent.value = false
    isClosingDrag.value = false
    return
  }

  // 이벤트 리스너 확실히 제거
  document.removeEventListener('mousemove', onManualDrag)
  document.removeEventListener('touchmove', onManualDrag)
  document.removeEventListener('mouseup', endManualDrag)
  document.removeEventListener('touchend', endManualDrag)

  // Transition 복원 (애니메이션 적용 위함)
  containerRef.value.style.transition = 'height 0.2s ease-out, transform 0.2s ease-out' // transform transition 추가

  // --- 드래그 결과 처리 ---
  const dragDelta = rawDragDelta.value // 최종 드래그 거리 (양수: 위, 음수: 아래)
  const STEP_DRAG_THRESHOLD = 30 // 스텝 이동을 위한 드래그 임계값 (px)

  // Case 1: 최소 높이에서 아래로 드래그 종료 (닫기 시도)
  if (startHeight.value === MIN_HEIGHT && isClosingDrag.value) {
    // 임계값 이상 아래로 드래그했으면 닫기 (뒤로 가기)
    if (dragDelta < -CLOSE_DRAG_THRESHOLD) {
      // 닫기 전 애니메이션 (선택 사항: 부드럽게 사라지게 등)
      containerRef.value.style.transform = 'translateY(100%)'
      // 애니메이션 후 라우터 이동을 위해 setTimeout 사용
      setTimeout(() => {
        closePopup()
      }, 200) // 트랜지션 시간과 일치시킴
    } else {
      // 임계값 미만이면 원위치 (transform 초기화, 애니메이션 적용됨)
      containerRef.value.style.transform = 'translateY(0)'
      containerRef.value.style.height = `${MIN_HEIGHT}px` // 높이 확실히 설정
      containerRef.value.style.opacity = '1'
      currentHeight.value = MIN_HEIGHT
    }
  }
  // Case 2: 일반적인 높이 조절 드래그 종료 (스텝 이동 로직)
  else if (isDragging.value) {
    // isDragging 상태였을 때만 스텝 로직 실행
    const steps = [MIN_HEIGHT, MID_HEIGHT, MAX_HEIGHT]
    // 시작 높이에 가장 가까운 스텝 인덱스 찾기
    const startIndex = steps.reduce((closestIndex, step, index) => {
      return Math.abs(step - startHeight.value) < Math.abs(steps[closestIndex] - startHeight.value)
        ? index
        : closestIndex
    }, 0)

    let targetIndex = startIndex // 기본적으로 현재 스텝 유지

    // 위로 드래그 (다음 스텝으로 이동 시도)
    if (dragDelta > STEP_DRAG_THRESHOLD && startIndex < steps.length - 1) {
      targetIndex = startIndex + 1
    }
    // 아래로 드래그 (이전 스텝으로 이동 시도)
    else if (dragDelta < -STEP_DRAG_THRESHOLD && startIndex > 0) {
      targetIndex = startIndex - 1
    }

    // 최종 목표 높이 설정
    const targetHeight = steps[targetIndex]
    currentHeight.value = targetHeight

    // 높이와 transform 최종 적용 (애니메이션)
    containerRef.value.style.height = `${targetHeight}px`
    containerRef.value.style.transform = 'translateY(0)' // 스텝 이동 시 transform은 항상 0
    containerRef.value.style.opacity = '1'
  }
  // Case 3: 스크롤 중 종료된 경우 (아무 작업 안함)
  else if (isScrollingContent.value) {
    // 스크롤 종료 시 특별히 할 작업 없음
  }

  // 상태 초기화
  isDragging.value = false
  isScrollingContent.value = false
  isClosingDrag.value = false
  rawDragDelta.value = 0 // raw 값 초기화
}

// --- 기타 UI 상호작용 함수 ---

// 채팅 팝업 토글
const toggleChatPopup = () => {
  showChatPopup.value = !showChatPopup.value
  // 채팅 열 때 최소 높이면 중간 높이로 자동 조절
  if (showChatPopup.value && heightState.value === 'min') {
    currentHeight.value = MID_HEIGHT
    if (containerRef.value) {
      containerRef.value.style.height = `${MID_HEIGHT}px` // 즉시 높이 반영
      containerRef.value.style.transform = 'translateY(0)' // transform 초기화
    }
  }
}

// 채팅 컴포넌트 높이 변경 시 호출되는 핸들러
const handleChatHeightChange = (chatHeight: number) => {
  // 채팅창 + 헤더/패딩 등 필요한 최소 높이 계산
  const requiredParentHeight = chatHeight + 120 // 예시 값, 실제 레이아웃에 맞게 조정 필요
  // 필요한 높이가 현재 높이보다 크면, 최대 높이 제한 내에서 높이 증가
  if (requiredParentHeight > currentHeight.value) {
    currentHeight.value = Math.min(MAX_HEIGHT, requiredParentHeight)
    if (containerRef.value) {
      containerRef.value.style.height = `${currentHeight.value}px` // 높이 반영
    }
  }
}

// 팝업 닫기 (라우트 변경) - 직접 호출될 일은 적어짐 (뒤로가기 제스처 사용)
const closePopup = () => {
  showChatPopup.value = false // 채팅 팝업도 닫기
  const query = { ...route.query }
  delete query.place // URL에서 place 쿼리 파라미터 제거
  router.replace({
    // 브라우저 히스토리 스택에 남기지 않고 이동
    path: route.path,
    query: query
  })
}

// 길찾기 기능 호출
const findDirectionsCall = async () => {
  if (!detail.value) return
  // mapStore의 길찾기 함수 호출 (현재 위치 -> 장소 위치)
  mapStore.setDirections(
    globalStore.lat,
    globalStore.lng,
    detail.value.latitude,
    detail.value.longitude
  )
  // 길찾기 누르면 팝업 닫기 (선택 사항)
  const query = { ...route.query }
  delete query.place
  router.replace({ path: route.path, query: query })
}

// --- Watchers ---

// 라우트 쿼리 변경 감지 (place 파라미터)
watch(
  () => route.query,
  async (newQuery, oldQuery) => {
    // place 파라미터가 생겼을 때만 팝업 열기
    if (newQuery.place && !oldQuery?.place) {
      loading.value = true
      await nextTick() // DOM 업데이트 기다림
      await getPlaceDetail() // 장소 상세 정보 가져오기
      dialog.value = true // 팝업 표시
      // 팝업 열릴 때 초기 상태 설정
      await nextTick() // dialog=true 반영 후 DOM 업데이트 기다림
      if (containerRef.value) {
        containerRef.value.style.transition = 'none' // 초기 애니메이션 충돌 방지
        currentHeight.value = MIN_HEIGHT // 초기 높이는 최소
        containerRef.value.style.height = `${MIN_HEIGHT}px` // 초기 높이 설정
        containerRef.value.style.transform = 'translateY(0)' // transform 초기화
        // 강제 리플로우 (간혹 transition none 이 즉시 반영 안될 때)
        // void containerRef.value.offsetHeight;
        // 다음 프레임에서 transition 복원 (slideUp 애니메이션 위해)
        requestAnimationFrame(() => {
          if (containerRef.value)
            containerRef.value.style.transition = 'height 0.2s ease-out, transform 0.2s ease-out'
        })
      }
    }
    // place 파라미터가 없어졌을 때 팝업 닫기
    else if (!newQuery.place && oldQuery?.place) {
      dialog.value = false // 팝업 숨김 (CSS 애니메이션으로 사라짐)
      showChatPopup.value = false // 채팅 팝업도 숨김
    }
  },
  { immediate: true } // 컴포넌트 마운트 시 즉시 실행
)

// v-model 변경 감지 (외부에서 팝업 상태 변경 시)
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== dialog.value) {
      // 외부에서 강제로 열거나 닫을 때 라우트 동기화 (선택적)
      const query = { ...route.query }
      if (newVal && !query.place) {
        // 외부에서 열려고 하는데 place 파라미터 없으면 추가? (동작 정의 필요)
        // 예: router.push({ query: { ...query, place: 'some_default_id' } });
      } else if (!newVal && query.place) {
        delete query.place
        router.replace({ path: route.path, query: query })
      } else {
        dialog.value = newVal // 단순 동기화
      }
    }
  }
)

// 내부 dialog 상태 변경 시 v-model 업데이트
watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
})

// 높이 상태 변경 감지 (채팅 팝업 관리)
watch(heightState, (newState) => {
  // 팝업이 최소화되면 채팅 팝업 자동으로 닫기
  if (newState === 'min' && showChatPopup.value) {
    showChatPopup.value = false
  }
})

// --- Lifecycle Hooks ---

onMounted(() => {
  // onMounted 시점에는 watch immediate가 이미 실행되었을 수 있음
  // 추가적인 초기화 필요 시 여기에 작성
})

onBeforeUnmount(() => {
  // 컴포넌트 언마운트 시 document에 등록된 이벤트 리스너 확실히 제거
  document.removeEventListener('mousemove', onManualDrag)
  document.removeEventListener('touchmove', onManualDrag)
  document.removeEventListener('mouseup', endManualDrag)
  document.removeEventListener('touchend', endManualDrag)
})
</script>

<template>
  <div v-if="dialog" class="popup-overlay">
    <div ref="containerRef" class="popup-container" :style="{ height: `${currentHeight}px` }">
      <div
        ref="dragHandleRef"
        class="drag-handle"
        @mousedown.stop="handleDragStart"
        @touchstart.stop="handleDragStart"
      >
        <div class="drag-indicator"></div>
      </div>

      <v-btn
        color="primary"
        icon
        @click="findDirectionsCall"
        class="btn-navigation"
        variant="elevated"
        aria-label="길찾기"
      >
        <Navigation />
        <span v-if="detail?.distance_meters > 0" class="distance-badge text-overline">{{
          formatDistance(detail.distance_meters)
        }}</span>
      </v-btn>

      <PlaceHeader
        :loading="loading"
        :detail="detail"
        @mousedown="handleContentMouseDown"
        @touchstart="handleContentTouchStart"
      />

      <div
        ref="contentRef"
        class="popup-content"
        :class="{
          'is-draggable': !isScrollable,
          'allow-scroll': isScrollable
        }"
        @mousedown="handleContentMouseDown"
        @touchstart="handleContentTouchStart"
      >
        <PlacePhotos
          v-if="detail?.photos?.length"
          :loading="loading"
          :photos="detail?.photos"
          :isMaxHeight="isMaxHeight"
          class="place-photos"
        />

        <div class="tab-navigation">
          <div class="tab active"><span class="tab-text">개요</span></div>
          <div class="tab"><span class="tab-text">메뉴</span></div>
          <div class="tab"><span class="tab-text">리뷰</span></div>
          <div class="tab"><span class="tab-text">사진</span></div>
          <div class="tab"><span class="tab-text">업데이트</span></div>
          <div class="tab"><span class="tab-text">정보</span></div>
        </div>

        <InfoPanel :loading="loading" :detail="detail" @showchatpop="toggleChatPopup" />

        <ChatPanel
          :loading="loading"
          :detail="detail"
          :showChatPopup="showChatPopup"
          :parentHeightState="heightState"
          :parentHeight="currentHeight"
          @update:showChatPopup="showChatPopup = $event"
          @chat-height-change="handleChatHeightChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none; /* 오버레이 자체는 이벤트 방해 안 함 */
}

.popup-container {
  position: relative;
  background-color: white;
  border-radius: 16px 16px 0 0; /* 좀 더 둥글게 */
  overflow: hidden;
  /* height와 transform에 대한 transition 분리 */
  transition:
    height 0.2s ease-out,
    transform 0.2s ease-out;
  display: flex;
  flex-direction: column;
  width: 100%;
  /* 애니메이션 성능 향상 위한 힌트 */
  will-change: height, transform;
  /* 초기 상태 (애니메이션 시작 전): translateY(0)으로 변경하고, slideUp 애니메이션으로 제어 */
  transform: translateY(0);
  animation: slideUp 0.3s ease-out forwards; /* 위로 슬라이드 애니메이션 */
  pointer-events: auto; /* 컨테이너는 이벤트 수신 */
  border-top: 1px solid #eee;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.12); /* 그림자 강화 */
  overscroll-behavior-y: contain; /* 내부 스크롤이 부모 스크롤 방지 */

  .btn-navigation {
    display: flex; /* 내부 요소 정렬 위해 */
    .distance-badge {
      position: absolute;
      top: 53px; /* 버튼 아래 위치 조정 */
      left: 50%; /* 가운데 정렬 */
      transform: translateX(-50%); /* 정확한 가운데 정렬 */
      padding: 3px 6px; /* 패딩 조정 */
      background-color: rgba(0, 0, 0, 0.7); /* 배경 약간 투명하게 */
      color: white; /* 텍스트 색상 흰색 */
      border-radius: 10px;
      line-height: normal;
      font-size: 10px; /* 글자 크기 조정 */
      white-space: nowrap; /* 줄바꿈 방지 */
    }
  }
}

/* 위로 슬라이드 애니메이션 */
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.drag-handle {
  height: 20px; /* 영역 약간 넓게 */
  display: flex;
  align-items: center; /* 중앙 정렬 */
  justify-content: center;
  cursor: grab; /* 드래그 가능 커서 */
  user-select: none; /* 텍스트 선택 방지 */
  touch-action: none; /* 모바일에서 기본 터치 동작 방지 (스크롤 등) */
  z-index: 100; /* 다른 요소 위에 오도록 */
  /* background-color: #f8f8f8; */ /* 핸들 영역 구분 (선택 사항) */
}

.drag-indicator {
  width: 40px; /* 너비 약간 넓게 */
  height: 5px; /* 두께 약간 두껍게 */
  background-color: #d0d0d0; /* 색상 약간 진하게 */
  border-radius: 3px;
}

.btn-navigation {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10; /* 다른 요소 위에 오도록 */
}

.popup-content {
  flex: 1; /* 남은 공간 모두 차지 */
  position: relative; /* 내부 요소 position 기준 */
  overflow-y: hidden; /* 기본적으로 스크롤 숨김 */
  /* background-color: #fff; */ /* 배경색 명시 (필요 시) */
}

/* 스크롤 허용 시 */
.popup-content.allow-scroll {
  overflow-y: auto; /* 세로 스크롤 자동 표시 */
  -webkit-overflow-scrolling: touch; /* iOS 부드러운 스크롤 */
}

/* 드래그 가능 상태 시 (스크롤 불가 상태) */
.popup-content.is-draggable {
  cursor: grab; /* 드래그 커서 */
  user-select: none; /* 텍스트 선택 방지 */
}

/* 장소 사진 컴포넌트 내부 이미지 (클릭 가능 시 커서 변경) */
.place-photos :deep(img) {
  /* :deep 사용 주의 */
  cursor: pointer !important;
}

.tab-navigation {
  position: sticky; /* 스크롤 시 상단 고정 */
  top: 0; /* 상단에 붙임 */
  z-index: 10; /* 다른 콘텐츠 위에 표시 */
  display: flex;
  width: 100%;
  overflow-x: auto; /* 가로 스크롤 가능 */
  background-color: white;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap; /* 탭 줄바꿈 방지 */
  scrollbar-width: none; /* Firefox 스크롤바 숨김 */
  &::-webkit-scrollbar {
    /* Chrome, Safari 스크롤바 숨김 */
    display: none;
  }
}

.tab {
  /* flex: 1; */ /* 내용 따라 너비 조절되도록 제거 */
  min-width: 60px; /* 최소 너비 */
  padding: 12px 16px; /* 좌우 패딩 증가 */
  text-align: center;
  font-size: 14px;
  color: #666;
  cursor: pointer; /* 클릭 가능 표시 */
  transition:
    color 0.2s,
    border-bottom-color 0.2s; /* 부드러운 전환 효과 */
  border-bottom: 2px solid transparent; /* 기본 밑줄 투명 */
  &:hover {
    color: #333; /* 호버 시 색상 변경 */
  }
}

.tab.active {
  color: #00796b; /* 활성 탭 색상 변경 (약간 어둡게) */
  font-weight: 600; /* 활성 탭 굵게 */
  border-bottom-color: #00796b; /* 활성 탭 밑줄 색상 */
}
</style>
