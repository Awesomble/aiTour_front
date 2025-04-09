<script setup lang="ts">
import { ref, reactive, onBeforeMount, nextTick, computed, watch } from 'vue'
import { useUserStore } from '@/store'
import { useRouter } from 'vue-router'
import { getInitials } from '@/plugins/utils'
import heic2any from 'heic2any'
import { putMeAPI, updateThumbnailAPI } from '@/network/app'
import dayjs from 'dayjs'
import countryCallingCodes from '@/assets/json/countries.json'
import { useToast } from 'vue-toastification'
import { UserInfo } from '@/types'
import { version } from '../../../package.json'

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()
const appVersion = ref(version)
const isLoading = ref<boolean>(false)
const emergencyContact = ref<HTMLDivElement | null>(null)
const emergencyContactNationality = ref<HTMLDivElement | null>(null)
const formRef = ref<HTMLFormElement | null>(null)
const formValid = ref<boolean>(false)
const bloodTypes = ['Unknown', 'A', 'A-', 'B', 'B-', 'AB', 'AB-', 'O', 'O-']
const birthDateInstance = ref<any>(null)
const expandedPanel = ref<number>(-1) // -1 means collapsed, 0 means expanded

const getCountryFlagUrl = (countryCode: string) => {
  if (!countryCode) return ''
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`
}

// 로그아웃 처리 함수
const handleLogout = async () => {
  try {
    await userStore.signOutUser()
    await router.push({name: 'main-home'})
    toast.info('로그아웃 되었습니다')
  } catch (error) {
    console.error('로그아웃 에러:', error)
    toast.error('로그아웃 중 오류가 발생했습니다')
  } finally {
  }
}

// Define form validation rules
const rules = {
  required: (v: string) => !!v || 'Field is required',
  nameRules: [
    (v: string) => !!v || 'Name is required',
    (v: string) => v.length <= 50 || 'Name must be less than 50 characters'
  ],
  bloodTypeRules: [
    (v: string) => !!v || 'Blood type is required',
    (v: string) =>
      /^(A|B|AB|O)[+-]$/.test(v) || 'Please enter a valid blood type (A+, B-, AB+, O-, etc.)'
  ],
  phoneRules: [
    (v: string) => !!v || 'Emergency contact is required',
    (v: string) => /^[+]?[\d\s-]{8,20}$/.test(v) || 'Please enter a valid phone number'
  ]
}

// FormData 초기화 수정
const formData = reactive<UserInfo>({
  user_name: userStore?.userInfo?.user_name || '',
  email: userStore?.userInfo?.email || '',
  birth_date: userStore?.userInfo?.user_name || '',
  blood_type: userStore?.userInfo?.blood_type || '',
  has_special_blood: !!userStore?.userInfo?.special_blood_type_info,
  emergency_contact: userStore?.userInfo?.emergency_contact || '',
  emergency_contact_nationality: userStore?.userInfo?.emergency_contact_nationality || '',
  language: userStore?.userInfo?.language || '',
  medical_info: userStore?.userInfo?.medical_info || '',
  nationality: userStore?.userInfo?.nationality || '',
  special_blood_type_info: userStore?.userInfo?.special_blood_type_info || '',
  thumbnail_url: userStore?.userInfo?.thumbnail_url || ''
})

// 의료 정보 글자 수 계산을 위한 computed 속성
const medicalInfoLength = computed(() => {
  return formData.medical_info?.length || 0
})

watch(() => userStore.userInfo, (newValue) => {
  if (newValue) {
    setUserInfo()
  }
})

const handleProfileImageChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  if (!file) return

  isLoading.value = true
  try {
    // HEIC 파일인 경우 JPEG로 변환
    let processedFile = file
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      try {
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        })
        processedFile = new File([convertedBlob as Blob], file.name.replace(/\.heic$/i, '.jpg'), {
          type: 'image/jpeg'
        })
      } catch (err) {
        console.error('HEIC conversion failed', err)
        toast.error('HEIC 변환 실패')
        isLoading.value = false
        return
      }
    }

    const reader = new FileReader()
    reader.readAsDataURL(processedFile)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const MAX_WIDTH = 800
        const MAX_HEIGHT = 800
        let { width, height } = img

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.floor(height * (MAX_WIDTH / width))
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.floor(width * (MAX_HEIGHT / height))
            height = MAX_HEIGHT
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const formData = new FormData()
                formData.append('file', blob, processedFile.name)
                try {
                  const res = await updateThumbnailAPI(formData)
                  if (res.status === 200) {
                    toast.success('프로필 사진 업데이트 성공')
                    await userStore.getUserInfo()
                    setUserInfo()
                  } else {
                    toast.error('프로필 사진 업데이트 실패')
                  }
                } catch (error) {
                  console.error('Profile image update error:', error)
                  toast.error('프로필 사진 업데이트 중 오류가 발생했습니다')
                }
              }
              isLoading.value = false
            },
            processedFile.type,
            0.8
          )
        } else {
          isLoading.value = false
          toast.error('이미지 처리 중 오류가 발생했습니다')
        }
      }
    }
  } catch (error) {
    console.error('Profile image processing error:', error)
    toast.error('이미지 처리 중 오류가 발생했습니다')
    isLoading.value = false
  }
}

const submitForm = async () => {
  try {
    isLoading.value = true

    // 폼 유효성 검사
    const { valid } = await formRef.value?.validate() || { valid: false }
    if (!valid) {
      toast.error('입력 정보를 확인해주세요')
      isLoading.value = false
      return
    }

    // 국적 처리 (객체 또는 문자열일 수 있음)
    const nationalityCode = typeof formData.nationality === 'object'
      ? formData.nationality?.code
      : formData.nationality

    const res = await putMeAPI({
      user_name: formData.user_name,
      nationality: nationalityCode,
      birth_date: formData.birth_date,
      blood_type: formData.blood_type,
      special_blood_type_info: formData.has_special_blood ? formData.special_blood_type_info : '',
      emergency_contact_nationality: formData.emergency_contact_nationality,
      emergency_contact: formData.emergency_contact,
      medical_info: formData.medical_info
    })
    if (res?.status === 200) {
      toast.success('개인정보 업데이트 완료')
      await userStore.getUserInfo()
      setUserInfo()
      expandedPanel.value = -1 // 패널 닫기
    }
  } catch (error) {
    console.error('Form submission error:', error)
    toast.error('폼 제출 중 오류가 발생했습니다')
  } finally {
    isLoading.value = false
  }
}

// 사용자 정보 설정 함수 개선
const setUserInfo = () => {
  // FormData 업데이트
  formData.user_name = userStore.userInfo?.user_name || ''
  formData.email = userStore.userInfo?.email || ''
  formData.birth_date = userStore.userInfo?.birth_date || ''
  formData.blood_type = userStore.userInfo?.blood_type || ''
  formData.has_special_blood = !!userStore.userInfo?.special_blood_type_info
  formData.emergency_contact = userStore.userInfo?.emergency_contact
  formData.emergency_contact_nationality = userStore.userInfo?.emergency_contact_nationality
  formData.language = userStore.userInfo?.language || ''
  formData.medical_info = userStore.userInfo?.medical_info || ''
  if (userStore.userInfo?.nationality) {
    if (typeof userStore.userInfo?.nationality === 'string') {
      const found = countryCallingCodes.find((country: any) => country.code === userStore.userInfo?.nationality)
      formData.nationality = found
    } else {
      formData.nationality = userStore.userInfo?.nationality
    }
  } else {
    formData.nationality = ''
  }
  formData.special_blood_type_info = userStore.userInfo?.special_blood_type_info || ''
  formData.thumbnail_url = userStore.userInfo?.thumbnail_url || ''
  console.log(formData)
}

// Mobiscroll 초기화 함수
const initializeMobiscroll = async () => {
  if (typeof window.mobiscroll === 'undefined') {
    console.error('Mobiscroll library is not loaded')
    toast.error('날짜 선택 라이브러리 로드 실패')
    return
  }

  if (birthDateInstance.value !== null) {
    try {
      birthDateInstance.value.destroy()
    } catch (e) {
      console.warn('Error destroying previous instance:', e)
    }
  }

  await nextTick()

  try {
    birthDateInstance.value = window.mobiscroll.datepicker('#birthDate', {
      controls: ['date'],
      touchUi: true,
      theme: 'ios',
      display: 'bottom',
      returnFormat: 'jsdate',
      max: new Date(dayjs().subtract(14, 'year')),
      onChange: async () => {
        const date = birthDateInstance.value.getVal()
        if (date) formData.birth_date = dayjs(date).format('YYYY-MM-DD')
      }
    })
  } catch (err) {
    console.error('Error initializing mobiscroll:', err)
    toast.error('날짜 선택 초기화 중 오류가 발생했습니다')
  }
}

// 컴포넌트 마운트 시 데이터 로드
onBeforeMount(async () => {
  if (!userStore.userInfo) await userStore.getUserInfo()
  setUserInfo()
})
</script>

<template>
  <v-container class="profile-container pa-0 pt-16 pb-16">
    <!-- Profile images -->
    <div class="profile-images-section px-4 d-flex align-center">
      <div class="header-section px-4 pt-4 pb-3 d-flex justify-space-between align-center">
        <div>
          <h1 class="text-h5 font-weight-bold mb-0">{{ formData?.user_name }}</h1>
          <div class="address text-body-2">{{ formData?.email }}</div>
        </div>
      </div>
      <v-spacer />
      <div class="main-profile-img position-relative">
        <v-avatar size="80" color="white" class="main-avatar">
          <v-img v-if="formData?.thumbnail_url" :src="formData?.thumbnail_url" cover />
          <span v-else class="text-h4">{{ getInitials(formData?.user_name) }}</span>
        </v-avatar>
        <v-btn
          icon
          class="edit-avatar-btn"
          density="comfortable"
          color="white"
          variant="flat"
          size="small"
          :disabled="isLoading"
        >
          <v-icon size="12" color="black">mdi-pencil</v-icon>
          <input
            type="file"
            accept="image/png, image/jpeg, image/bmp, image/heic"
            @change="handleProfileImageChange"
            class="file-input-overlay"
          />
        </v-btn>
      </div>
    </div>

    <!-- Settings section -->
    <div class="settings-section px-4 mt-6">
      <div class="section-title text-subtitle-1 mb-3">My Info</div>

      <!-- Expandable Profile Form Section -->
      <v-sheet rounded="lg" class="settings-item mb-2">
        <v-expansion-panels
          v-model="expandedPanel"
          @update:modelValue="(val) => (val === 0 ? initializeMobiscroll() : '')"
          variant="accordion"
        >
          <v-expansion-panel class="settings-panel" elevation="0">
            <v-expansion-panel-title class="py-3 px-4" hide-actions>
              <div class="d-flex align-center justify-space-between w-100">
                <div>
                  <div class="text-subtitle-1 font-weight-medium">내 계정</div>
                  <div class="text-body-2 text-medium-emphasis">개인정보 및 의료정보 변경</div>
                </div>
                <v-icon
                  color="#9E9E9E"
                  size="20"
                  :icon="expandedPanel === 0 ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                ></v-icon>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <v-form ref="formRef" v-model="formValid" lazy-validation class="form-content">
                <!-- Personal Information Form -->
                <!-- Name Field -->
                <div class="form-field-container mb-5">
                  <v-text-field
                    v-model="formData.user_name"
                    :rules="rules.nameRules"
                    variant="underlined"
                    hide-details
                    label="성명"
                    class="form-field"
                    clearable
                  ></v-text-field>
                </div>

                <div class="form-field-container mb-5">
                  <v-autocomplete
                    v-model="formData.nationality"
                    :rules="[rules.required]"
                    :items="countryCallingCodes"
                    label="국적"
                    variant="underlined"
                    hide-details
                    item-title="name"
                    item-value="code"
                    return-object
                    @update:modelValue="(val) => nextTick(() => {
                      formData.emergency_contact_nationality = val?.callingCode
                    })"
                  >
                    <!-- Custom item in the dropdown list -->
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <div class="country-flag" v-if="item.raw.code">
                            <img :src="getCountryFlagUrl(item.raw.code)" :alt="item.raw.name" width="24" height="18">
                          </div>
                          <div class="country-flag-placeholder" v-else></div>
                        </template>
                      </v-list-item>
                    </template>

                    <!-- Custom display of selected value -->
                    <template v-slot:selection="{ item }">
                      <div class="d-flex align-center">
                        <img
                          v-if="item.raw?.code"
                          :src="getCountryFlagUrl(item.raw?.code)"
                          :alt="item.raw?.name"
                          width="24"
                          height="18"
                          class="me-2"
                        >
                        {{ item.raw?.name || '' }}
                      </div>
                    </template>
                  </v-autocomplete>
                </div>

                <div class="form-field-container mb-5">
                  <v-text-field
                    v-model="formData.birth_date"
                    @click="birthDateInstance?.open()"
                    variant="underlined"
                    hide-details
                    readonly
                    label="생년월일"
                    clearable
                  />
                  <input id="birthDate" style="visibility: hidden" />
                </div>

                <div class="form-field-container mb-5 d-flex gap-4">
                  <v-autocomplete
                    ref="emergencyContactNationality"
                    v-show="!formData.emergency_contact_nationality"
                    v-model="formData.emergency_contact_nationality"
                    :rules="[rules.required]"
                    :items="countryCallingCodes"
                    label="긴급연락처 국번"
                    variant="underlined"
                    hide-details
                    item-title="name"
                    item-value="callingCode"
                    @update:modelValue="() => nextTick(() => {
                      // if (emergencyContact) emergencyContact.focus()
                    })"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <div class="country-flag" v-if="item.raw.code">
                            <img :src="getCountryFlagUrl(item.raw.code)" :alt="item.raw.name" width="24" height="18">
                          </div>
                        </template>
                        <template v-slot:append>
                          {{ item.raw?.callingCode }}
                        </template>
                      </v-list-item>
                    </template>
                    <template v-slot:selection="{ item }">
                      <div class="d-flex align-center">
                        {{ item.raw?.callingCode || '' }}
                      </div>
                    </template>
                  </v-autocomplete>
                  <v-text-field
                    v-show="formData.emergency_contact_nationality"
                    ref="emergencyContact"
                    v-model="formData.emergency_contact"
                    :prefix="formData.emergency_contact_nationality"
                    :rules="[rules.required]"
                    append-inner-icon="mdi-refresh"
                    @click:append-inner="() => nextTick(() => {
                      formData.emergency_contact_nationality = ''
                      formData.emergency_contact = ''
                    })"
                    variant="underlined"
                    label="긴급연락처"
                    type="tel"
                    hide-details
                    clearable
                  />
                </div>

                <div class="medical-section mt-6 mb-5">
                  <div class="form-field-label d-flex align-center mb-3">
                    <v-icon icon="mdi-medical-bag" class="mr-2" color="red"></v-icon>
                    <span>의료 정보</span>
                  </div>

                  <!-- Blood Type Row -->
                  <div class="form-field-container mb-5">
                    <div class="d-flex gap-2">
                      <v-select
                        v-model="formData.blood_type"
                        :items="bloodTypes"
                        :rules="[rules.required]"
                        variant="underlined"
                        hide-details
                        label="혈액형"
                        class="form-field"
                      ></v-select>

                      <v-checkbox
                        v-if="formData.blood_type !== 'Unknown'"
                        v-model="formData.has_special_blood"
                        color="error"
                        label="특수 혈액형"
                        hide-details
                        class="ml-2 mt-2"
                      ></v-checkbox>
                    </div>
                  </div>

                  <!-- Special Blood Type Info Field -->
                  <div class="form-field-container mb-5" v-if="formData.has_special_blood">
                    <v-text-field
                      v-model="formData.special_blood_type_info"
                      variant="underlined"
                      hide-details
                      placeholder="예: 봄베이 표현형, Rh-null 등"
                      label="특수 혈액형 정보"
                      class="form-field"
                      clearable
                    ></v-text-field>
                  </div>

                  <!-- Medical Information Textarea -->
                  <div class="form-field-container mb-5">
                    <v-textarea
                      v-model="formData.medical_info"
                      variant="underlined"
                      rows="3"
                      row-height="20"
                      placeholder="알레르기, 질환, 복용 중인 약물 등"
                      hide-details
                      label="의료 관련 특이사항"
                      class="form-field"
                      clearable
                      maxlength="200"
                    ></v-textarea>
                    <div class="d-flex justify-end mt-1">
                      <span class="text-caption text-medium-emphasis">
                        {{ medicalInfoLength }}/200
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons-container">
                  <v-btn
                    :loading="isLoading"
                    block
                    color="primary"
                    height="52"
                    elevation="0"
                    :disabled="!formValid"
                    @click="submitForm"
                    class="save-btn"
                  >
                    저장하기
                  </v-btn>
                </div>
              </v-form>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-sheet>

      <!-- App version info -->
      <div class="app-version-section d-flex align-center mt-4 mb-4">
        <div class="app-version-label flex-grow-1">앱 버전 정보</div>
        <div class="d-flex align-center">
          <span class="version-number mr-2">전체버전 {{ appVersion }}</span>
          <v-btn
            size="small"
            variant="tonal"
            density="comfortable"
            color="grey"
            class="update-btn"
            height="28"
          >
            업데이트
          </v-btn>
        </div>
      </div>

      <!-- 로그아웃 버튼 -->
      <v-btn
        block
        color="error"
        variant="text"
        height="48"
        class="logout-btn mt-4 mb-6"
        prepend-icon="mdi-logout"
        @click="handleLogout"
      >
        로그아웃
      </v-btn>
    </div>
  </v-container>
</template>

<style scoped>
.profile-container {
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  position: relative;
  padding-bottom: 64px; /* For bottom navigation */
}

/* Header section styling */
.header-section h1 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.address {
  font-size: 14px;
  color: #636363;
  margin-top: 3px;
  font-weight: 400;
}

/* Profile image styling */
.main-avatar {
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.edit-avatar-btn {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background-color: white;
  border: 1px solid #e0e0e0;
  height: 24px;
  width: 24px;
  min-width: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.file-input-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

/* Settings section styling */
.section-title {
  color: #333333;
  margin-left: 4px;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.settings-item {
  border-radius: 12px;
  overflow: hidden;
  background-color: white;
}

/* Expansion panel styling */
.settings-panel {
  background-color: white !important;
}

.settings-panel :deep(.v-expansion-panel-title) {
  min-height: 68px;
  padding: 0;
}

.settings-panel :deep(.v-expansion-panel-text__wrapper) {
  padding: 16px 16px 16px 16px;
}

/* Form styling */
.form-content {
  padding: 16px 6px;
}

.form-field-container {
  margin-bottom: 20px;
}

.form-field-label {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}

.form-field {
  border-radius: 8px;
}

.form-field :deep(.v-field__outline) {
  border-color: #e0e0e0 !important;
  border-width: 1px !important;
}

.form-field :deep(.v-field--focused .v-field__outline) {
  border-color: #1976d2 !important;
  border-width: 2px !important;
}

.form-field :deep(.v-field__field) {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}

.medical-info {
  background-color: rgba(3, 169, 244, 0.03);
  border-left: 3px solid #03a9f4;
}

.emergency-contact {
  background-color: rgba(244, 67, 54, 0.03);
  border-left: 3px solid #f44336;
}

.action-buttons-container {
  margin-top: 32px;
}

.save-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
  font-size: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #42a5f5, #1976d2);
}

/* App version section */
.app-version-section {
  padding: 0 4px;
}

.app-version-label {
  font-size: 13px;
  color: #757575;
  font-weight: 400;
}

.version-number {
  font-size: 13px;
  color: #757575;
}

.update-btn {
  font-size: 12px;
  text-transform: none;
  letter-spacing: 0;
  color: #424242;
  background-color: #e0e0e0;
  border-radius: 4px;
}

.country-flag {
  width: 24px;
  height: 18px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.country-flag img {
  max-width: 100%;
  object-fit: cover;
  border-radius: 2px;
}

/* 로그아웃 버튼 스타일 */
.logout-btn {
  border-radius: 8px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
  font-size: 14px;
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.5);
}

.logout-btn:hover {
  background-color: rgba(244, 67, 54, 0.04);
}
</style>