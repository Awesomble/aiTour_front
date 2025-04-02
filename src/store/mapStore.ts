import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'

type Directions = {
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
}

const useMapStore = defineStore('map', () => {
  const directions: Ref<Directions | null> = ref(null)
  const mapInst: Ref<any> = ref(null)

  function setDirections(startLat: number, startLng: number, destLat: number, destLng: number) {
    console.log(startLat, startLng, destLat, destLng)
    directions.value = {
      startLat,
      startLng,
      destLat,
      destLng
    }
  }

  function setDirectionsNull() {
    directions.value = null
  }

  return {
    mapInst,
    directions,
    setDirections,
    setDirectionsNull
  }
})

export default useMapStore