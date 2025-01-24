<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const tabsIdx = ref<number>(0)
onBeforeMount(() => {})
</script>

<template>
  <v-container>
    <div class="tabs"
         :class="`active${tabsIdx}`"
    >
      <ul>
        <li><a href="javascript:;" @click="tabsIdx = 0">Topic</a></li>
        <li><a href="javascript:;" @click="tabsIdx = 1">Follow</a></li>
      </ul>
    </div>
    <swiper :slides-per-view="1"
            :space-between="10"
            class="mt-4"
            height="200"
    >
      <swiper-slide class="banner" @click="router.push({ name: 'map', query: { type: 'camera' } })">
        <img src="https://picsum.photos/500/300?image=238" height="200" class="stacked-image rounded-lg" />
        <div class="info">
          <p class="icon d-flex ga-2">
            <v-icon color="pink" size="x-small" icon="mdi-camera-account" />
            <v-chip :ripple="false" label>
              1Km
            </v-chip>
          </p>
          <p class="disc">Almardo Adyenture Labs Happy hours Commute</p>
        </div>
      </swiper-slide>
      <swiper-slide class="banner" @click="router.push({ name: 'map', query: { type: 'camera' } })">
        <img src="https://picsum.photos/500/300?image=301" height="200" class="stacked-image rounded-lg" />
        <div class="info">
          <p class="icon d-flex ga-2">
            <v-icon color="pink" size="x-small" icon="mdi-camera-account" />
            <v-chip :ripple="false" label>
              1Km
            </v-chip>
          </p>
          <p class="disc">Almardo Adyenture Labs Happy hours Commute</p>
        </div>
      </swiper-slide>
      <swiper-slide class="banner" @click="router.push({ name: 'map', query: { type: 'camera' } })">
        <img src="https://picsum.photos/500/300?image=239" height="200" class="stacked-image rounded-lg" />
        <div class="info">
          <p class="icon d-flex ga-2">
            <v-icon color="pink" size="x-small" icon="mdi-camera-account" />
            <v-chip :ripple="false" label>
              1Km
            </v-chip>
          </p>
          <p class="disc">Almardo Adyenture Labs Happy hours Commute</p>
        </div>
      </swiper-slide>
    </swiper>
  </v-container>
</template>

<style lang="scss">
.tabs {
  position: relative;
  padding-bottom: 12px;
  ul {
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    li {
      a {
        text-decoration: none;
        font-size: 30px;
        font-weight: 900;
        color: #000;
      }
    }
  }
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    height: 5px;
    border-radius: 5px;
    background-color: deeppink;
    transition: .3s left ease-in-out, .3s width ease-in-out;
  }
  &.active0::after {
    left: 0;
    width: 80px;
  }
  &.active1::after {
    left: 110px;
    width: 100px;
  }
}
.banner {
  position: relative;
  img {
    width: 100%;
    object-fit: cover;
  }
  .info {
    position: absolute;
    left: 0;
    bottom: 0;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    justify-content: flex-end;
    width: 75%;
    padding: 10px;
    box-sizing: border-box;
    color: #fff;
    .icon {
      >.v-icon {
        padding: 12px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.8);
      }
      >.v-chip {
        height: 24px;
        line-height: 24px;
        background-color: rgba(255, 255, 255, 0.8);
        .v-chip__content {
          font-size: 10px;
          font-weight: bold;
          color: #000!important;
        }
      }
    }
  }
}
</style>
