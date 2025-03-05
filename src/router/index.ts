import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'full-layout',
      component: () => import('@/layouts/FullLayout.vue'),
      children: [
        {
          path: '/auth',
          name: 'auth',
          component: () => import('@/views/auth/Auth.vue'),
          meta: {}
        },
        {
          path: '/signin',
          name: 'signin',
          component: () => import('@/views/auth/Signin.vue'),
          meta: {}
        }
      ]
    },
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
          component: () => import('@/views/planner/TourPlanner.vue'),
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
          path: 'categories',
          name: 'admin-categories',
          component: () => import('@/views/admin/Category.vue'),
          meta: {
            title: 'Category Manager'
          }
        },
        {
          path: 'hashtags',
          name: 'admin-hashtags',
          component: () => import('@/views/admin/Hashtag.vue'),
          meta: {
            title: 'Hashtag Manager'
          }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/error/Error404.vue'),
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router
