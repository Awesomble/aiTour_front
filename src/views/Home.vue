<script setup lang="ts">
import { nextTick, onBeforeMount, ref } from 'vue'
import Cookies from 'js-cookie'
import { useGlobalStore } from '@/store'
import { GoogleMap, CustomMarker, Marker } from 'vue3-google-map'

const golbalStore = useGlobalStore()
const init = async () => {
  await customElements.whenDefined('gmp-map')

  const map = document.querySelector('gmp-map')
  // const marker = document.querySelector('gmp-advanced-marker');
  // const placePicker = document.querySelector('gmpx-place-picker');
  // const infowindow = new google.maps.InfoWindow();
  //
  // map.innerMap.setOptions({
  //   mapTypeControl: false
  // });
  //
  // placePicker.addEventListener('gmpx-placechange', () => {
  //   const place = placePicker.value;
  //
  //   if (!place.location) {
  //     window.alert(
  //       "No details available for input: '" + place.name + "'"
  //     );
  //     infowindow.close();
  //     marker.position = null;
  //     return;
  //   }
  //
  //   if (place.viewport) {
  //     map.innerMap.fitBounds(place.viewport);
  //   } else {
  //     map.center = place.location;
  //     map.zoom = 17;
  //   }
  //
  //   marker.position = place.location;
  //   infowindow.setContent(
  //     `<strong>${place.displayName}</strong><br>
  //      <span>${place.formattedAddress}</span>
  //   `);
  //   infowindow.open(map.innerMap, marker);
  // });
}
const GPSInter = ref<any>(null)
const center = ref({ lat: 37.5663, lng: 126.9779 })
const zoom = ref(15)
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
  }
}
onBeforeMount(() => {
  nextTick(() => {
    // init()
    if (!GPSInter.value) {
      GPSInter.value = setInterval(() => {
        setGPS()
      }, 3000)
    }
  })
})
</script>

<template>
  <v-container class="pa-0 h-100">
    <!--    <gmp-map :center="center" :zoom="zoom" map-id="DEMO_MAP_ID" />-->
    <GoogleMap
      api-key="AIzaSyByb_XcWvlXKOerQ84vhmodfpI1wEkOjH0"
      class="gmp-map"
      :center="center"
      :zoom="zoom"
    >
      <CustomMarker :options="{ position: center, anchorPoint: 'CENTER_CENTER' }">
        <div class="element">
          <div class="pulse" />
          <div class="marker" />
        </div>
      </CustomMarker>
<!--      <Marker :options="{ position: center }" />-->
    </GoogleMap>
    <v-btn
      class="btn-floating"
      icon="mdi-image-filter-center-focus"
      color="primary"
      @click="myLocationCall"
    />
  </v-container>
</template>

<style lang="scss">
.gmp-map {
  width: 100%;
  height: calc(100% + 25px);
  .gm-style-mtc-bbw {
    display: none;
  }
  .gmnoprint {
    display: none !important;
  }
  .gm-fullscreen-control {
    display: none !important;
  }
}
.btn-floating {
  position: fixed;
  right: 30px;
  bottom: 80px;
  z-index: 99;
}
.element {
  position: relative;
}

.pulse {
  position: absolute;
  top: 0;
  right: 0;
  height: 30px;
  width: 30px;
  z-index: 10;
  border: 5px solid #1483C2;
  border-radius: 70px;
  animation: pulse 1s ease-out infinite;
}

.marker {
  position: absolute;
  top: 10px;
  right: 10px;
  height: 10px;
  width: 10px;
  border-radius: 50%;
  background-color: #1483C2;
}

@keyframes pulse {
  0% {
    -webkit-transform: scale(0);
    opacity: 0.0;
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
    opacity: 0.0;
  }
}
</style>
