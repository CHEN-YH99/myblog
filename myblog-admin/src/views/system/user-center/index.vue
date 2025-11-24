<template>
  <div class="page-content user">
    <div class="content">
      <div class="left-wrap">
        <div class="user-wrap box-style">
          <img class="bg" src="@imgs/user/bg.jpg" :alt="t('userCenter.card.coverAlt')" />
          <img class="avatar" :src="userAvatar" :alt="t('userCenter.card.avatarAlt')" />
          <h2 class="name">{{ userInfo.userName }}</h2>
          <p class="des">{{ t('userCenter.card.greeting', { name: userInfo.userName }) }}</p>

          <div class="outer-info">
            <div>
              <i class="iconfont-sys">&#xe72e;</i>
              <span>{{ t('userCenter.card.info.email') }}</span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe608;</i>
              <span>{{ t('userCenter.card.info.role') }}</span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe736;</i>
              <span>{{ t('userCenter.card.info.location') }}</span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe811;</i>
              <span>{{ t('userCenter.card.info.department') }}</span>
            </div>
          </div>

          <div class="lables">
            <h3>{{ t('userCenter.card.tagsTitle') }}</h3>
            <div>
              <div v-for="item in labelList" :key="item">
                {{ item }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="right-wrap">
        <div class="info box-style">
          <h1 class="title">{{ t('userCenter.sections.basicSettings') }}</h1>

          <ElForm
            :model="form"
            class="form"
            ref="ruleFormRef"
            :rules="rules"
            label-width="86px"
            label-position="top"
          >
            <ElRow>
              <ElFormItem :label="t('userCenter.form.realName')" prop="realName">
                <el-input v-model="form.realName" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem :label="t('userCenter.form.sex')" prop="sex" class="right-input">
                <ElSelect
                  v-model="form.sex"
                  :placeholder="t('userCenter.form.selectGender')"
                  :disabled="!isEdit"
                >
                  <ElOption
                    v-for="item in genderOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem :label="t('userCenter.form.nikeName')" prop="nikeName">
                <ElInput v-model="form.nikeName" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem :label="t('userCenter.form.email')" prop="email" class="right-input">
                <ElInput v-model="form.email" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem :label="t('userCenter.form.mobile')" prop="mobile">
                <ElInput v-model="form.mobile" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem :label="t('userCenter.form.address')" prop="address" class="right-input">
                <ElInput v-model="form.address" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElFormItem :label="t('userCenter.form.des')" prop="des" :style="{ height: '130px' }">
              <ElInput type="textarea" :rows="4" v-model="form.des" :disabled="!isEdit" />
            </ElFormItem>

            <div class="el-form-item-right">
              <ElButton type="primary" style="width: 90px" v-ripple @click="edit">
                {{ isEdit ? t('userCenter.actions.save') : t('userCenter.actions.edit') }}
              </ElButton>
            </div>
          </ElForm>
        </div>

        <div class="info box-style" style="margin-top: 20px">
          <h1 class="title">{{ t('userCenter.sections.changePassword') }}</h1>

          <ElForm :model="pwdForm" class="form" label-width="86px" label-position="top">
            <ElFormItem :label="t('userCenter.form.password')" prop="password">
              <ElInput
                v-model="pwdForm.password"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem :label="t('userCenter.form.newPassword')" prop="newPassword">
              <ElInput
                v-model="pwdForm.newPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem :label="t('userCenter.form.confirmPassword')" prop="confirmPassword">
              <ElInput
                v-model="pwdForm.confirmPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <div class="el-form-item-right">
              <ElButton type="primary" style="width: 90px" v-ripple @click="editPwd">
                {{ isEditPwd ? t('userCenter.actions.save') : t('userCenter.actions.edit') }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useUserStore } from '@/store/modules/user'
  import { ElForm, FormInstance, FormRules, ElMessage } from 'element-plus'
  import { fetchChangePassword } from '@/api/user'
  import { HttpError } from '@/utils/http/error'

  defineOptions({ name: 'UserCenter' })

  const { t } = useI18n()

  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)

  const getDefaultAvatar = (username: string) => {
    const name = username || 'User'
    const colors = ['409eff', '67c23a', 'e6a23c', 'f56c6c', '909399']
    const color = colors[name.length % colors.length]
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=200`
  }

  const userAvatar = computed(() => {
    const info = userInfo.value as any
    const name = info?.userName || 'User'
    const avatar = info?.avatar
    return avatar && typeof avatar === 'string' && avatar.length > 0
      ? avatar
      : getDefaultAvatar(name)
  })

  const isEdit = ref(false)
  const isEditPwd = ref(false)
  const date = ref('')
  const form = reactive({
    realName: 'HUiChen',
    nikeName: '大炮',
    email: '463463463@gmall.com',
    mobile: '18888888888',
    address: '广东省广州市天河区',
    sex: '1',
    des: '欢迎来到小灰个人博客'
  })

  const pwdForm = reactive({
    password: '',
    newPassword: '',
    confirmPassword: ''
  })

  const ruleFormRef = ref<FormInstance>()

  const rules = computed<FormRules>(() => ({
    realName: [
      { required: true, message: t('userCenter.validation.realNameRequired'), trigger: 'blur' },
      { min: 2, max: 50, message: t('userCenter.validation.realNameLength'), trigger: 'blur' }
    ],
    nikeName: [
      { required: true, message: t('userCenter.validation.nikeNameRequired'), trigger: 'blur' },
      { min: 2, max: 50, message: t('userCenter.validation.nikeNameLength'), trigger: 'blur' }
    ],
    email: [{ required: true, message: t('userCenter.validation.emailRequired'), trigger: 'blur' }],
    mobile: [{ required: true, message: t('userCenter.validation.mobileRequired'), trigger: 'blur' }],
    address: [{ required: true, message: t('userCenter.validation.addressRequired'), trigger: 'blur' }],
    sex: [{ required: true, message: t('userCenter.validation.genderRequired'), trigger: 'change' }]
  }))

  const genderOptions = computed(() => [
    {
      value: '1',
      label: t('userCenter.gender.male')
    },
    {
      value: '2',
      label: t('userCenter.gender.female')
    }
  ])

  const labelList = computed(() => [
    t('userCenter.card.tags.design'),
    t('userCenter.card.tags.creative'),
    t('userCenter.card.tags.curious'),
    t('userCenter.card.tags.bold'),
    t('userCenter.card.tags.gamer'),
    t('userCenter.card.tags.inclusive')
  ])

  onMounted(() => {
    getDate()
  })

  const getDate = () => {
    const d = new Date()
    const h = d.getHours()
    let textKey = 'greeting.morning'

    if (h >= 6 && h < 12) {
      textKey = 'greeting.morning'
    } else if (h >= 12 && h < 18) {
      textKey = 'greeting.afternoon'
    } else if (h >= 18 && h < 24) {
      textKey = 'greeting.evening'
    } else {
      textKey = 'greeting.dawn'
    }

    date.value = t(textKey)
  }

  const edit = () => {
    isEdit.value = !isEdit.value
  }

  const editPwd = async () => {
    // 切换到编辑模式
    if (!isEditPwd.value) {
      isEditPwd.value = true
      return
    }

    // 保存修改：进行基础校验
    if (!pwdForm.password) {
      ElMessage.error(t('userCenter.messages.enterCurrentPassword'))
      return
    }
    if (!pwdForm.newPassword) {
      ElMessage.error(t('userCenter.messages.enterNewPassword'))
      return
    }
    if (!pwdForm.confirmPassword) {
      ElMessage.error(t('userCenter.messages.confirmNewPassword'))
      return
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      ElMessage.error(t('userCenter.messages.passwordMismatch'))
      return
    }
    if (pwdForm.newPassword.length < 6) {
      ElMessage.error(t('userCenter.messages.passwordTooShort'))
      return
    }

    try {
      await fetchChangePassword({
        currentPassword: pwdForm.password,
        newPassword: pwdForm.newPassword
      })

      // 成功提示并强制重新登录
      ElMessage.success(t('userCenter.messages.passwordUpdated'))
      isEditPwd.value = false
      // 重置表单
      pwdForm.password = ''
      pwdForm.newPassword = ''
      pwdForm.confirmPassword = ''

      // 退出登录，跳转到登录页
      userStore.logOut()
    } catch (error: any) {
      if (error instanceof HttpError) {
        if (error.code === 400) {
          ElMessage.error(t('userCenter.messages.currentPasswordIncorrect'))
        } else if (error.code === 401) {
          ElMessage.error(t('userCenter.messages.sessionExpired'))
          userStore.logOut()
        } else {
          ElMessage.error(error.message || t('userCenter.messages.passwordChangeFailed'))
        }
      } else {
        ElMessage.error(error?.message || t('userCenter.messages.passwordChangeFailed'))
      }
    }
  }
</script>

<style lang="scss">
  .user {
    .icon {
      width: 1.4em;
      height: 1.4em;
      overflow: hidden;
      vertical-align: -0.15em;
      fill: currentcolor;
    }
  }
</style>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;

    $box-radius: calc(var(--custom-radius) + 4px);

    .box-style {
      border: 1px solid var(--art-border-color);
    }

    .content {
      position: relative;
      display: flex;
      justify-content: space-between;
      margin-top: 10px;

      .left-wrap {
        width: 450px;
        margin-right: 25px;

        .user-wrap {
          position: relative;
          height: 600px;
          padding: 35px 40px;
          overflow: hidden;
          text-align: center;
          background: var(--art-main-bg-color);
          border-radius: $box-radius;

          .bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 200px;
            object-fit: cover;
          }

          .avatar {
            position: relative;
            z-index: 10;
            width: 80px;
            height: 80px;
            margin-top: 120px;
            object-fit: cover;
            border: 2px solid #fff;
            border-radius: 50%;
          }

          .name {
            margin-top: 20px;
            font-size: 22px;
            font-weight: 400;
          }

          .des {
            margin-top: 20px;
            font-size: 14px;
          }

          .outer-info {
            width: 300px;
            margin: auto;
            margin-top: 30px;
            text-align: left;

            > div {
              margin-top: 10px;

              span {
                margin-left: 8px;
                font-size: 14px;
              }
            }
          }

          .lables {
            margin-top: 40px;

            h3 {
              font-size: 15px;
              font-weight: 500;
            }

            > div {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              margin-top: 15px;

              > div {
                padding: 3px 6px;
                margin: 0 10px 10px 0;
                font-size: 12px;
                background: var(--art-main-bg-color);
                border: 1px solid var(--art-border-color);
                border-radius: 2px;
              }
            }
          }
        }

        .gallery {
          margin-top: 25px;
          border-radius: 10px;

          .item {
            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }
        }
      }

      .right-wrap {
        flex: 1;
        overflow: hidden;
        border-radius: $box-radius;

        .info {
          background: var(--art-main-bg-color);
          border-radius: $box-radius;

          .title {
            padding: 15px 25px;
            font-size: 20px;
            font-weight: 400;
            color: var(--art-text-gray-800);
            border-bottom: 1px solid var(--art-border-color);
          }

          .form {
            box-sizing: border-box;
            padding: 30px 25px;

            > .el-row {
              .el-form-item {
                width: calc(50% - 10px);
              }

              .el-input,
              .el-select {
                width: 100%;
              }
            }

            .right-input {
              margin-left: 20px;
            }

            .el-form-item-right {
              display: flex;
              align-items: center;
              justify-content: end;

              .el-button {
                width: 110px !important;
              }
            }
          }
        }
      }
    }
  }

  @media only screen and (max-width: $device-ipad-vertical) {
    .page-content {
      .content {
        display: block;
        margin-top: 5px;

        .left-wrap {
          width: 100%;
        }

        .right-wrap {
          width: 100%;
          margin-top: 15px;
        }
      }
    }
  }
</style>
