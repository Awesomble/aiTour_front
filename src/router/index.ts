import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'default-layout',
      redirect: 'home',
      component: () => import('@/layouts/DefaultLayout.vue'),
      children: [
        {
          path: '/home',
          name: 'home',
          component: () => import('@/views/home/Home.vue'),
          meta: {
            keepAlive: true
          }
        },
        {
          path: '/tourPlanner',
          name: 'tour-planner',
          component: () => import('@/views/TourPlanner.vue'),
          meta: {
            keepAlive: true
          }
        },
        {
          path: '/myBag',
          name: 'my-bag',
          component: () => import('@/views/mybag/MyBag.vue'),
          meta: {
            keepAlive: true
          }
        },
        {
          path: '/map',
          name: 'map',
          component: () => import('@/views/map/Map.vue'),
          meta: {
            keepAlive: true
          }
        }
      ]
    },
    {
      path: '/admin',
      name: 'admin-layout',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/Dashboard.vue'),
          meta: {
            title: 'Dashboard'
          }
        },
        {
          path: 'place',
          name: 'admin-place',
          component: () => import('@/views/admin/Place.vue'),
          meta: {
            title: 'Place Manager'
          }
        },
        {
          path: 'place/:id',
          name: 'admin-place-detail',
          component: () => import('@/views/admin/PlaceDetail.vue'),
          meta: {
            title: 'Place Detail Manager'
          }
        },
        {
          path: 'hashtag',
          name: 'admin-hashtag',
          component: () => import('@/views/admin/Hashtag.vue'),
          meta: {
            title: 'Hashtag Manager'
          }
        }
      ]
    },
  ],
  linkActiveClass: 'active', // 활성화된 링크에 적용되는 기본 클래스
  linkExactActiveClass: 'exact-active', // 정확히 일치하는 링크에만 적용
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
})

export default router
