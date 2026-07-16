import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

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
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('../views/user/index.vue'),
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
  } else {
    next()
  }
})

export default router
