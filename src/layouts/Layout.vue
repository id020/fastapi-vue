<template>
  <div>
    <el-container>
      <div class="app-shell">
        <el-aside class="sidebar">
          <div class="brand">
            <span class="brand-mark">A</span>
            <span>管理控制台</span>
          </div>
          <!-- 只渲染当前用户从服务端获得的页面菜单。 -->
          <el-menu :default-active="route.path" router class="side-menu">
            <el-menu-item v-for="menu in navMenus" :key="menu.id" :index="menu.path">
              <el-icon>
                <User v-if="menu.name.includes('用户')" />
                <OfficeBuilding v-else-if="menu.name.includes('部门')" />
                <Avatar v-else-if="menu.name.includes('角色')" />
                <Menu v-else-if="menu.name.includes('菜单')" />
                <Grid v-else />
              </el-icon>
              <span>{{ menu.name }}</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
      </div>
      <el-container class="workspace">
        <el-header class="topbar">
          <div class="breadcrumbs">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">工作空间</el-breadcrumb-item>
              <el-breadcrumb-item>{{ route.meta.title || '工作台' }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="account">
            <div class="avatar">
              {{ auth.user?.nickname?.slice(0, 1) || '管' }}
            </div>
            <span>{{ auth.user?.nickname || '管理员' }}</span>
            <el-button text @click="signOut">退出</el-button>
          </div>
        </el-header>
        <el-main><router-view /></el-main>
      </el-container>
    </el-container>
  </div>
</template>


<script setup>
import {computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useAuthStore} from '@/stores/auth'
import {Avatar, Grid, Menu, OfficeBuilding, User} from "@element-plus/icons-vue";

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const navMenus = computed(() => auth.menus.filter((menu) => menu.menu_type === 'menu' && menu.path))

function signOut() {
  // 退出时先清空内存权限，再返回登录页。
  auth.logout()
  router.replace('/login')
}
</script>
