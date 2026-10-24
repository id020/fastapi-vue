<template>
  <div class="login-page">
    <div class="login-art">
      <div class="art-orbit orbit-one"></div>
      <div class="art-orbit orbit-two"></div>
      <div class="art-copy"><span class="eyebrow">ACCESS CONTROL PLATFORM</span>
        <h1>让权限管理<br/>清晰而可靠</h1>
        <p>用户、角色、菜单与数据范围<br/>在一个工作空间中统一管理。</p></div>
      <div class="art-footer">FASTAPI <span>×</span> VUE 3</div>
    </div>
    <div class="login-panel">
      <div class="login-form-wrap">
        <div class="login-brand"><span class="brand-mark">A</span> 管理控制台</div>
        <span class="eyebrow muted">WELCOME BACK</span>
        <h2>登录你的工作空间</h2>
        <p class="login-hint">请输入管理员账号和密码继续</p>
        <!-- 表单回车和按钮点击都使用同一登录提交逻辑。 -->
        <el-form :model="form" label-position="top" @submit.prevent="submit">
          <el-form-item label="账号">
            <el-input v-model="form.username" size="large" autocomplete="username" placeholder="请输入账号"/>
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" size="large" type="password" show-password autocomplete="current-password"
                      placeholder="请输入密码" @keyup.enter="submit"/>
          </el-form-item>
          <el-button class="login-button" type="primary" size="large" :loading="loading" @click="submit">登录系统 <span>→</span>
          </el-button>
        </el-form>
        <div class="login-note">演示账号由后端 <code>.env</code> 初始化配置提供</div>
      </div>
      <div class="login-copyright">© 2026 Admin Console · 安全访问管理</div>
    </div>
  </div>
</template>


<script setup>
import {reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {ElMessage} from 'element-plus'

import {useAuthStore} from '../stores/auth'
import {errorMessage} from "@/utils/request.js";

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const form = reactive({username: 'admin', password: '123'})

async function submit() {
  // 防止重复提交，并将认证失败原因显示给用户。
  loading.value = true
  try {
    await auth.login(form.username, form.password);
    await router.replace('/dashboard')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ================= Login页面样式 ================= */
.login-page {
  min-height: 100vh;
  background: white;
  display: grid;
  grid-template-columns: minmax(360px,44%) 1fr
}

.login-art {
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg,#4c5fcf 0%,#5d6fe0 58%,#8b98ef 100%);
  padding: 54px 59px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between
}

.login-art:before {
  content: '';
  position: absolute;
  width: 620px;
  height: 620px;
  border: 1px solid #ffffff25;
  border-radius: 50%;
  bottom: -320px;
  left: -218px;
  box-shadow: 0 0 0 40px #ffffff0a,0 0 0 88px #ffffff08,0 0 0 142px #ffffff06
}

.art-orbit {
  position: absolute;
  border: 1px solid #ffffff30;
  border-radius: 50%;
  pointer-events: none
}

.orbit-one {
  width: 390px;
  height: 390px;
  right: -213px;
  top: 58px
}

.orbit-two {
  width: 230px;
  height: 230px;
  right: -133px;
  top: 138px
}

.art-copy {
  position: relative;
  z-index: 1;
  margin: auto 0
}

.art-copy h1 {
  font-size: 38px;
  line-height: 1.43;
  letter-spacing: 1px;
  margin: 21px 0 15px
}

.art-copy p {
  color: #e1e5ff;
  font-size: 13px;
  line-height: 2
}

.art-footer {
  position: relative;
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 1.2px;
  color: #d6dcff
}

.art-footer span {
  padding: 0 7px;
  color: #aebafa
}

.login-panel {
  position: relative;
  display: grid;
  place-items: center;
  padding: 55px
}

.login-form-wrap {
  width: min(380px,100%);
  margin-top: -12px
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 650;
  color: #293952;
  margin-bottom: 72px
}

.login-form-wrap h2 {
  font-size: 24px;
  letter-spacing: -.7px;
  color: #20314b;
  margin: 10px 0 8px
}

.login-hint {
  font-size: 11px;
  color: #99a3b2;
  margin: 0 0 33px
}

.login-form-wrap .el-form-item {
  margin-bottom: 19px
}

.login-form-wrap .el-form-item__label {
  font-size: 11px!important;
  color: #536078!important
}

.login-form-wrap .el-input__wrapper {
  height: 43px;
  padding: 0 13px
}

.login-button {
  width: 100%;
  height: 44px;
  margin-top: 10px;
  background: #5368e8;
  border: 0;
  border-radius: 7px;
  font-size: 12px;
  box-shadow: 0 7px 15px #5368e82b
}

.login-button span {
  margin-left: auto;
  font-size: 17px;
  font-weight: 300
}

.login-note {
  margin-top: 22px;
  font-size: 10px;
  color: #a1abba
}

.login-note code {
  background: #f1f3f8;
  padding: 2px 5px;
  border-radius: 3px;
  color: #66738c
}

.login-copyright {
  position: absolute;
  bottom: 24px;
  color: #adb5c2;
  font-size: 9px;
  letter-spacing: .2px
}
</style>