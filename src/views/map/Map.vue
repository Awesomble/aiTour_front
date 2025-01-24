<script setup lang="ts">
import { nextTick, onActivated, onBeforeMount, onMounted, ref } from 'vue'
import Cookies from 'js-cookie'
import { useGlobalStore } from '@/store'
import photoZone from '@/assets/json/photoZone.json'
import { useRoute } from 'vue-router'

const route = useRoute()
const golbalStore = useGlobalStore()
const GPSInter = ref<any>(null)
const center = ref<object>({ lat: 37.5663, lng: 126.9779 })
const zoom = ref(15)
const mapStyle = [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#e9e9e9'
      },
      {
        lightness: 17
      }
    ]
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [
      {
        color: '#f5f5f5'
      },
      {
        lightness: 20
      }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#ffffff'
      },
      {
        lightness: 17
      }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#ffffff'
      },
      {
        lightness: 29
      },
      {
        weight: 0.2
      }
    ]
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [
      {
        color: '#ffffff'
      },
      {
        lightness: 18
      }
    ]
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [
      {
        color: '#ffffff'
      },
      {
        lightness: 16
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [
      {
        color: '#f5f5f5'
      },
      {
        lightness: 21
      }
    ]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [
      {
        color: '#dedede'
      },
      {
        lightness: 21
      }
    ]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [
      {
        visibility: 'on'
      },
      {
        color: '#ffffff'
      },
      {
        lightness: 16
      }
    ]
  },
  {
    elementType: 'labels.text.fill',
    stylers: [
      {
        saturation: 36
      },
      {
        color: '#333333'
      },
      {
        lightness: 40
      }
    ]
  },
  {
    elementType: 'labels.icon',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [
      {
        color: '#f2f2f2'
      },
      {
        lightness: 19
      }
    ]
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#fefefe'
      },
      {
        lightness: 20
      }
    ]
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#fefefe'
      },
      {
        lightness: 17
      },
      {
        weight: 1.2
      }
    ]
  }
]
const mountIdx = ref<number>(0)
let map: any

const mapInit = async () => {
  try {
    // await loadGoogleMapsScript()
    // 이 시점에 google.maps.Map이 존재하는지 확인
    if (!google.maps) {
      console.error('Google Maps가 올바르게 로드되지 않았습니다.')
      return
    }
    const { Map } = await google.maps.importLibrary('maps')
    map = new Map(document.getElementById('instMap'), {
      mapId: 'instMap',
      center: center.value,
      zoom: zoom.value,
      disableDefaultUI: true,
      styles: mapStyle
    })
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')
    const priceTag = document.createElement('div')
    priceTag.className = 'iam'

    const iam = new AdvancedMarkerElement({
      map,
      position: center.value,
      content: priceTag
    })
  } catch (err) {
    console.error(err)
  }
}

const setGPS = () => {
  const lat = Cookies.get('lat')
  const long = Cookies.get('long')
  if (lat && long) golbalStore.setGPS(Number(lat), Number(long))
  else {
    golbalStore.setGPS(golbalStore.lat, Number(golbalStore.long) + 0.001)
  }
}
const myLocationCall = () => {
  if (golbalStore.lat && golbalStore.long) {
    center.value = { lat: golbalStore.lat, lng: golbalStore.long }
    zoom.value = 15
  }
}
const activater = async () => {
  const { type } = route.query
  if (type) {
    if (type === 'camera') {
      const { photozone } = photoZone
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')
      for (let i = 0; i < photozone.length; i++) {
        const AdvancedMarkerElement = new google.maps.marker.AdvancedMarkerElement({
          map,
          content: makePlace(photozone[i].photos[0]),
          position: {
            lat: photozone[i].gps.lat,
            lng: photozone[i].gps.lng
          }
        })
        AdvancedMarkerElement.addListener('click', () => {
          console.log(AdvancedMarkerElement, i)
        })
      }
    }
  }
}
const makePlace = (url) => {
  const content = document.createElement('div')
  content.classList.add('pin')
  content.innerHTML = `<img src="${url}" /><`
  return content
}
onActivated(() => {
  activater()
})
onMounted(() => {
  setGPS()
  mapInit()
  GPSInter.value = setInterval(() => {
    setGPS()
  }, 3000)
})
</script>
<template>
  <v-container class="pa-0 h-100">
    <div id="instMap" class="h-100" />
    <div class="mounter" :class="`active${mountIdx}`">
      <ul>
        <li><a href="javascript:" @click="mountIdx = 0"><v-icon icon="mdi-camera-account" /></a></li>
        <li><a href="javascript:" @click="mountIdx = 1"><v-icon icon="mdi-toilet" /></a></li>
        <li><a href="javascript:" @click="mountIdx = 2"><v-icon icon="mdi-toilet" /></a></li>
        <li><a href="javascript:" @click="mountIdx = 3"><v-icon icon="mdi-toilet" /></a></li>
        <li><a href="javascript:" @click="mountIdx = 4"><v-icon icon="mdi-toilet" /></a></li>
        <li><a href="javascript:" @click="mountIdx = 5"><v-icon icon="mdi-toilet" /></a></li>
      </ul>
    </div>
    <v-btn
      class="btn-floating"
      icon="mdi-image-filter-center-focus"
      color="primary"
      @click="myLocationCall"
    />
  </v-container>
</template>

<style lang="scss">
.mounter {
  position: fixed;
  right: 20px;
  bottom: 140px;
  z-index: 99;
  width: 50px;
  border: 4px solid #1483c2;
  border-radius: 50px;
  background-color: #fff;
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.2);
  ul {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 10px 0;
    gap: 15px;
    li {
      a {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30%;
        border-radius: 50%;
        background-color: #fff;
      }
    }
  }
  &::after {
    content: '';
    position: absolute;
    left: 1px;
    top: 2px;
    display: flex;
    width: 40px;
    height: 40px;
    border: 4px solid #1483c2;
    border-radius: 50%;
    transition: .3s top ease-in-out;
  }
  &.active0::after {
    top: 2px;
  }
  &.active1::after {
    top: 30px;
  }
  &.active2::after {
    top: 130px;
  }
  &.active3::after {
    top: 230px;
  }
  &.active4::after {
    top: 330px;
  }
  &.active5::after {
    top: 30px;
  }
  &.active6::after {
    top: 30px;
  }
}
.pin {
  border-radius: 50% 50% 50% 0;
  border: 4px solid #1483c2;
  width: 40px;
  height: 40px;
  transform: rotate(-45deg);
  overflow: hidden;
}

.pin img {
  margin-top: -8px;
  margin-left: -8px;
  width: 150%;
  height: 150%;
  object-fit: contain;
  border-radius: 50%;
}
.btn-floating {
  position: fixed;
  right: 20px;
  bottom: 75px;
  z-index: 99;
}
.iam {
  height: 10px;
  width: 10px;
  border-radius: 50%;
  background-color: #1483c2;
  &::after {
    position: absolute;
    top: -10px;
    left: -10px;
    height: 30px;
    width: 30px;
    z-index: 10;
    border: 5px solid #1483c2;
    border-radius: 70px;
    animation: pulse 0.8s ease-in-out infinite;
    content: '';
  }
}

.marker {
  position: absolute;
  top: 10px;
  right: 10px;
  height: 10px;
  width: 10px;
  border-radius: 50%;
  background-color: #1483c2;
}

@keyframes pulse {
  0% {
    -webkit-transform: scale(0);
    opacity: 0;
  }

  25% {
    -webkit-transform: scale(0.1);
    opacity: 0.1;
  }

  50% {
    -webkit-transform: scale(0.5);
    opacity: 0.3;
  }

  75% {
    -webkit-transform: scale(0.8);
    opacity: 0.5;
  }

  100% {
    -webkit-transform: scale(1);
    opacity: 0;
  }
}
</style>
