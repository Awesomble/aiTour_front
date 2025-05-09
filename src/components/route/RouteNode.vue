<script setup lang="ts">
import { ref, computed } from 'vue'
import { createLighterColor } from '@/views/map/utils/mapHelpers'
import { useRoute, useRouter } from 'vue-router'
import { shwPlaceDetail } from '@/composables/useRouter'
import { Footprints } from 'lucide-vue-next'
import { convert, convertMany } from 'convert'

const props = defineProps<{
  node: any,
  first: boolean,
  last: boolean
}>()
const route = useRoute()
const router = useRouter()

const shwPlaceDetailCall = (id: string) => {
  shwPlaceDetail(id, route, router)
}
</script>

<template>
  <div v-if="!first" class="distance-box">
    <div class="distance">
      <v-chip
        class="ma-2"
        color="green"
        :prepend-icon="Footprints"
      >
        {{ convert(node?.directions?.routes[0].distance, 'meter').to('km')?.toFixed(1) }}km {{ convertMany(`${node?.directions?.routes[0].duration}s`).to("minutes")?.toFixed(0) }}min
      </v-chip>
    </div>
  </div>
  <div @click="shwPlaceDetailCall(node.place_id)" class="place-box" :class="{'first' : first, 'last': last}">
    <div class="d-flex">
      <!-- 이미지 영역 -->
      <div class="icon">
        <div class="pin">
          <div class="pin-inner-circle" :style="`background-color: ${createLighterColor(node.category?.icon_color)}`">
            <div class="pin-icon-container" v-html="node.category?.icon" :style="`color: ${node.category?.icon_color}`"/>
            <div class="pin-icon-container">
              <v-img
                v-if="false"
                src="https://aitour-thumb.s3.ap-northeast-2.amazonaws.com/landmark/63c94bc4d9b14be89ecd9e1ce08de370.png"
                height="80"
                width="80"
                cover
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 컨텐츠 영역 -->
      <div class="content">
        <div v-if="route.photos?.length">
          <v-img :src="route.photos[0].url" />
        </div>
        <div>
          <div class="d-flex align-center">
            <span class="text-subtitle-1 font-weight-medium">{{ node.name }}</span>
            <div v-if="false" class="ml-2 d-flex align-center">
              <v-icon icon="mdi-star" color="amber-darken-2" size="16" class="mr-1"></v-icon>
              <span class="text-caption font-weight-medium amber-text text-amber-darken-2">{{
                '점수'
              }}</span>
            </div>
          </div>
          <div v-if="node.description" class="text-caption text-grey">{{ node.description }}</div>
          <div v-else class="text-caption text-grey">{{ node.address }}</div>
          <div v-if="node.hashtags" class="mt-1 d-flex">
          <v-chip
            v-for="(tag, idx) in node.hashtags"
            :key="`tag${idx}`"
            size="x-small"
            class="mr-1 text-caption"
            color="primary"
          >
            {{ tag.name }}
          </v-chip>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.distance-box {
  padding: 10px;
  .distance {
    display: flex;
    align-items: center;
    margin-left: 80px;
    height: 50px;
    padding: 10px;
    border-radius: 15px;
    border: 1px dotted #ccc;
    box-sizing: border-box;
  }
}
.place-box {
  padding: 10px;
  &.last {
    .icon {
      .pin {
        &:after {
          display: none;
        }
      }
    }
  }
  .icon {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    .pin {
      position: relative;
      width: 35px;
      height: 35px;
      background-color: white;
      border-radius: 30px;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pin-appear 0.3s ease;
      transition: all 0.2s ease;
      cursor: pointer;
      &::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        height: 500%;
        width: 1px;
        border-left: 1px dotted #ccc;
        z-index: 0;
      }
      .pin-inner-circle {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 2;
        .pin-icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: all 0.2s ease;

          svg {
            width: 16px;
            height: 16px;
            stroke-width: 1.2;
          }
        }
      }
    }
  }
  .content {
    display: flex;
    width: 100%;
    padding: 14px;
    border-radius: 15px;
    box-sizing: border-box;
    box-shadow: rgba(50, 50, 105, 0.15) 0px 2px 5px 0px, rgba(0, 0, 0, 0.05) 0px 1px 1px 0px;
    .text-caption {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
    }
  }
}
</style>
