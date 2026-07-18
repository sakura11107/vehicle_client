import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/user'

declare module 'vue-router' {
  interface RouteMeta {
    /** 允许访问该路由的角色码列表（0-普通用户 1-车辆管理员 2-系统管理员），不设置则登录即可访问 */
    roles?: number[]
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
  },
  {
    path: '/',
    component: () => import('../layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/index.vue'),
      },
      {
        path: 'vehicle',
        name: 'Vehicle',
        component: () => import('../views/vehicle/index.vue'),
        meta: { roles: [1, 2] },
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('../views/user/index.vue'),
        meta: { roles: [2] },
      },
      {
        path: 'reservation',
        name: 'Reservation',
        component: () => import('../views/reservation/index.vue'),
      },
      {
        path: 'message',
        name: 'Message',
        component: () => import('../views/message/index.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const publicPaths = ['/login', '/register']
  if (!publicPaths.includes(to.path) && !token) {
    next('/login')
    return
  }
  // 角色校验：路由声明了 roles 时，当前用户角色必须在列表内
  if (to.meta.roles && to.meta.roles.length > 0) {
    const userStore = useUserStore()
    const role = userStore.userInfo?.role ?? 0
    if (!to.meta.roles.includes(role)) {
      next('/dashboard')
      return
    }
  }
  next()
})

export default router
