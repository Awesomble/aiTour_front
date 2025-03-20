import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'
import { useToast } from 'vue-toastification'

const toast = useToast()
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'default-layout',
      redirect: 'mainHome',
      component: () => import('@/layouts/DefaultLayout.vue'),
      children: [
        {
          path: '/mainHome',
          name: 'main-home',
          component: () => import('@/views/home/MainHome.vue'),
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
          component: () => import('@/views/my/MyBag.vue'),
          meta: {
            // requiresAuth: true
          }
        },
        {
          path: '/myPage',
          name: 'my-page',
          component: () => import('@/views/my/MyPage.vue'),
          meta: {
            requiresAuth: true,
            historyBack: true
          }
        },
        {
          path: '/mainMap',
          name: 'main-map',
          component: () => import('@/views/map/MainMap.vue'),
          meta: {
          }
        },
        {
          path: '/notifications',
          name: 'notifications',
          component: () => import('@/views/my/Notifications.vue'),
          meta: {
            historyBack: true
          }
        },
        {
          path: '/authComplate',
          name: 'auth-complate',
          component: () => import('@/views/auth/authComplete.vue'),
          meta: {
            // requiresAuth: true
          }
        }
      ]
    },
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
          meta: {
          }
        }
      ]
    },
    {
      path: '/admin',
      name: 'admin-layout',
      redirect: 'dashboard',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/Dashboard.vue'),
          meta: {
            title: 'Dashboard',
            requiresAuth: true,
            roles: 'admin'
          }
        },
        {
          path: 'place',
          name: 'admin-place',
          component: () => import('@/views/admin/Place.vue'),
          meta: {
            title: 'Place Manager',
            requiresAuth: true,
            roles: 'admin'
          }
        },
        {
          path: 'place/:id',
          name: 'admin-place-detail',
          component: () => import('@/views/admin/PlaceDetail.vue'),
          meta: {
            title: 'Place Detail Manager',
            requiresAuth: true,
            roles: 'admin'
          }
        },
        {
          path: 'categories',
          name: 'admin-categories',
          component: () => import('@/views/admin/Category.vue'),
          meta: {
            title: 'Category Manager',
            requiresAuth: true,
            roles: 'admin'
          }
        },
        {
          path: 'categories/:id',
          name: 'admin-categories-detail',
          component: () => import('@/views/admin/CategoryDetail.vue'),
          meta: {
            title: 'Category Detail Manager',
            requiresAuth: true,
            roles: 'admin'
          }
        },
        {
          path: 'hashtags',
          name: 'admin-hashtags',
          component: () => import('@/views/admin/Hashtag.vue'),
          meta: {
            title: 'Hashtag Manager',
            requiresAuth: true,
            roles: 'admin'
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

router.beforeEach(async (to, from, next) => {
  console.log('to: ', to)
  if (to.meta.requiresAuth) {
    try {
      console.log('user call')
      const user = await getCurrentUser()
      console.log('user: ', user)
      if (!user) {
        toast.error('로그인이 필요합니다.')
        return next({
          path: '/signin',
          query: { redirect: to.fullPath }
        }) // 로그인 페이지나 로그인 로직 호출
      } else {
        next()
      }
    } catch {
      console.log('user error')
      return next({
        path: '/signin',
        query: { redirect: to.fullPath }
      })
    }
  }
  if (to.meta.roles && to.meta.roles === 'admin') {
    const authSession = await fetchAuthSession()
    const idTokenPayload = authSession.tokens?.idToken?.payload
    const groups = idTokenPayload?.['cognito:groups'] as string[]
    if (!groups?.includes('admin')) {
      toast.error('관리자 권한이 필요합니다.')
      return next({name: 'main-home'})
    }
  }
  next()
})
export default router
