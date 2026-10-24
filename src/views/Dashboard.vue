<template>
  <div class="page-heading">
    <div>
      <div class="eyebrow muted">OVERVIEW</div>
      <h1>工作台</h1>
      <p>欢迎回来，{{ auth.user?.nickname }}。这里是你的管理概览。</p></div>
    <div class="date-chip"><span class="date-icon">◷</span> 权限按角色实时加载</div>
  </div>
  <div class="welcome-card">
    <div><span class="welcome-tag">管理空间 · 安全访问</span>
      <h2>你好，{{ auth.user?.nickname }}</h2>
      <p>从左侧导航开始管理组织、访问权限与业务数据。</p></div>
    <div class="welcome-symbol">A<span></span></div>
  </div>
  <div class="section-title">
    <div><h2>快捷入口</h2>
      <p>你当前可访问的管理模块</p></div>
  </div>
  <div class="shortcut-grid">
    <button v-for="(item, index) in quickLinks" :key="item.id" class="shortcut-card" @click="router.push(item.path)">
      <span class="shortcut-icon" :class="`tone-${index % 4}`">{{ ['◈', '◎', '⌘', '▤'][index % 4] }}</span>
      <span class="shortcut-text"><b>{{ item.name }}</b><small>打开模块 <span>↗</span></small></span><span
        class="shortcut-arrow">→</span>
    </button>
    <div v-if="!quickLinks.length" class="empty-shortcuts">当前账号暂未分配其他管理菜单。</div>
  </div>
</template>

<script setup>
import {computed} from 'vue'
import {useRouter} from 'vue-router'
import {useAuthStore} from '@/stores/auth'

// 获取认证 Store 实例。
// auth.user：当前登录用户信息。
// auth.menus：当前用户有权访问的菜单列表。
const auth = useAuthStore()

// 获取路由实例。
const router = useRouter()

// 使用计算属性，从当前用户的菜单列表中筛选快捷入口。
const quickLinks = computed(() =>
    auth.menus.filter(
        (item) =>
            // 只显示普通菜单，不显示目录、按钮等其他类型。
            item.menu_type === 'menu' &&

            // 菜单必须配置 path，才能进行页面跳转。
            item.path &&

            // 排除工作台自身，避免重复显示当前页面入口。
            item.path !== '/dashboard',
    ),
)
</script>

<style scoped>
/* ================= Dashboard页面样式 ================= */
.welcome-card {
  height: 205px;
  border-radius: 14px;
  background: linear-gradient(112deg,#5869dc 0%,#6073e3 52%,#8290ed 100%);
  color: #fff;
  padding: 32px 39px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 12px 25px #5869dc24
}

.welcome-card:after {
  content: '';
  position: absolute;
  width: 470px;
  height: 470px;
  border: 1px solid #ffffff20;
  border-radius: 50%;
  right: 78px;
  top: -335px;
  box-shadow: 0 0 0 34px #ffffff0a,0 0 0 70px #ffffff08
}

.welcome-tag {
  display: inline-block;
  font-size: 9px;
  letter-spacing: .6px;
  padding: 6px 9px;
  border-radius: 5px;
  background: #ffffff1b;
  color: #e5e8ff
}

.welcome-card h2 {
  font-size: 22px;
  margin: 16px 0 6px;
  letter-spacing: -.4px
}

.welcome-card p {
  font-size: 11px;
  color: #e0e4ff;
  margin: 0
}

.welcome-symbol {
  font-size: 124px;
  font-weight: 700;
  color: #ffffff12;
  line-height: 1;
  position: relative;
  margin-right: 46px
}

.welcome-symbol span {
  position: absolute;
  width: 48px;
  height: 48px;
  border: 1px solid #ffffff55;
  border-radius: 15px;
  right: -7px;
  top: 15px;
  transform: rotate(18deg)
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 35px 0 15px
}

.section-title h2 {
  margin: 0 0 5px;
  font-size: 15px;
  color: #273750
}

.section-title p {
  font-size: 10px;
  color: #9aa5b5;
  margin: 0
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3,minmax(0,1fr));
  gap: 12px
}

.shortcut-card {
  height: 78px;
  border: 1px solid #edf0f5;
  background: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  text-align: left;
  cursor: pointer;
  transition: .18s;
  box-shadow: 0 2px 8px #27375004
}

.shortcut-card:hover {
  border-color: #dce0fc;
  transform: translateY(-2px);
  box-shadow: 0 8px 18px #2737500a
}

.shortcut-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 15px;
  margin-right: 12px;
  background: #eef0ff;
  color: #6573dd
}

.tone-1 {
  background: #eaf8f3;
  color: #39ad85
}

.tone-2 {
  background: #fff4e8;
  color: #e79c4b
}

.tone-3 {
  background: #f4edff;
  color: #9466d3
}

.shortcut-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1
}

.shortcut-text b {
  font-size: 11px;
  color: #43516a;
  font-weight: 600
}

.shortcut-text small {
  font-size: 9px;
  color: #a2abba
}

.shortcut-text small span {
  color: #6e7ce1;
  margin-left: 4px
}

.shortcut-arrow {
  color: #aeb6c4;
  font-size: 14px
}

.empty-shortcuts {
  grid-column: 1/-1;
  background: #fff;
  border: 1px dashed #e5e8ef;
  padding: 23px;
  text-align: center;
  border-radius: 9px;
  color: #98a3b3;
  font-size: 11px
}

.date-chip {
  padding: 9px 12px;
  border: 1px solid #eaedf3;
  border-radius: 7px;
  background: #fff;
  color: #8490a2;
  font-size: 10px
}

.date-icon {
  font-size: 13px;
  margin-right: 5px
}

</style>