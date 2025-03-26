<script setup>
import { defineProps } from 'vue'
import { MapPin } from 'lucide-vue-next'

const props = defineProps({
  mapType: {
    type: String,
    default: 'google',
    validator: (value) => ['google', 'naver'].includes(value)
  },
  startLat: Number,
  startLng: Number,
  destLat: Number,
  destLng: Number,
  transportMode: {
    type: String,
    default: 'driving'
  },
  color: {
    type: String,
    default: 'primary'
  },
  icon: {
    type: String,
    default: 'navigation'
  },
  text: {
    type: String,
    default: '길찾기'
  }
})

const openMap = () => {
  if (window.AndroidInterface && typeof window.AndroidInterface.openMapApp === 'function') {
    window.AndroidInterface.openMapApp(
      props.mapType,
      props.startLat,
      props.startLng,
      props.destLat,
      props.destLng,
      props.transportMode
    )
  } else {
    // 웹 환경에서의 대체 동작
    const url =
      props.mapType === 'google'
        ? `https://www.google.com/maps/dir/?api=1&origin=${props.startLat},${props.startLng}&destination=${props.destLat},${props.destLng}&travelmode=${props.transportMode}`
        : `https://map.naver.com/v5/directions/${props.startLng},${props.startLat},출발지,,/${props.destLng},${props.destLat},도착지,,/`
    window.open(url, '_blank')
  }
}
</script>

<template>
  <v-btn :color="color" icon @click="openMap" class="my-2" variant="elevated">
    <MapPin size="20" />
  </v-btn>
</template>
