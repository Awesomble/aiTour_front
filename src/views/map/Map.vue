<script setup lang="ts">
import { onActivated, onMounted, ref } from 'vue'
import Cookies from 'js-cookie'
import { useGlobalStore } from '@/store'
import { useRoute, useRouter } from 'vue-router'
import { getDrotectedAPI, getPlacesListAPI } from '@/network/app'
import { Toilet, Camera } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
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
const mountIdx = ref<number | null>(null)
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
const activeList = ref<object[]>([])

const activater = async () => {
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')
  for (let i = 0; i < activeList.value?.length; i++) {
    const item = activeList.value[i]
    if (item.latitude && item.longitude) {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        content: makePlace(`<p class="i${item?.category?.category_id}">`),
        position: {
          lat: item.latitude,
          lng: item.longitude
        }
      })
      marker.addListener('click', () => {
        handleMarkerClick(item.place_id) // 각 마커의 개별 ID로 함수 호출
      })
    }
  }
}
const handleMarkerClick = (id: string) => {
  router.push({query: {place: id}})
}

const makePlace = (inner: string) => {
  const content = document.createElement('div')
  content.classList.add('pin')
  content.innerHTML = inner
  return content
}
const page: number = 1
const limit: number = 50

const mountFN = async (id: number[], idx: number) => {
  mountIdx.value = idx
  activeList.value = []
  const res = await getPlacesListAPI(page, limit, id)
  if (res?.status === 200) {
    activeList.value = res.data?.items
    activater()
  }
}
const getDrotected = async () => {
  const res = await getDrotectedAPI()
  console.log(res)
}
onActivated(() => {
  activater()
})
onMounted(() => {
  setGPS()
  mapInit()
  getDrotected ()
  GPSInter.value = setInterval(() => {
    setGPS()
  }, 3000)
})
</script>
<template>
  <v-container class="pa-0 h-100 w-100" style="max-width: 100%">
    <div id="instMap" class="h-100" />
    <div class="mounter">
      <ul>
        <li>
          <v-btn :color="mountIdx === 0 ? 'primary' : 'white'" @click="mountFN([83], 0)" icon>
            <Camera :stroke-width="1" />
          </v-btn>
        </li>
        <li>
          <v-btn :color="mountIdx === 1 ? 'primary' : 'white'" @click="mountFN([77, 82], 1)" icon>
            <Toilet :stroke-width="1" />
          </v-btn>
        </li>
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
  ul {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 10px 0 8px;
    gap: 10px;
    li {
      a {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        border: 4px solid #1483c2;
        border-radius: 50px;
        background-color: #fff;
        color: #000;
        font-size: 14px;
      }
    }
  }
}
.pin {
  border-radius: 50% 50% 50% 0;
  border: 4px solid #1483c2;
  background-color: #1483c2;
  width: 25px;
  height: 25px;
  transform: rotate(-45deg);
  overflow: hidden;
  p {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: -4px;
    font-size: 16px;
    color: #fff;
    transform: rotate(45deg);
  }
  p.i83:after {
    content: "📷";
  }
  p.i77:after {
    content: "🚻";
  }
  p.i82:after {
    content: "👶";
  }
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
