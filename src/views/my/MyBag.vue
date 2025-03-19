<script setup lang="ts">
import { computed, onBeforeMount, ref, onMounted } from 'vue'
import { useUserStore } from '@/store'
import { getInitials } from '@/plugins/utils'
import countryCallingCodes from '@/assets/json/countries.json'
import { useRouter } from 'vue-router'

defineOptions({
  name: 'my-bag'
})

const router = useRouter()
const userStore = useUserStore()
const idNumber = ref(`T-${Math.floor(10000 + Math.random() * 90000)}`)
const showTooltip = ref(false)

// Country flag helper function
const getCountryFlagUrl = (countryCode: string) => {
  if (!countryCode) return ''
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`
}

// Find country object from code
const getCountryObject = (countryCode: string) => {
  if (!countryCode) return null
  return countryCallingCodes.find(
    (country) => country.code.toLowerCase() === countryCode.toLowerCase()
  )
}

// Computed properties for country data
const userCountry = computed(() => {
  if (!userStore.userInfo?.nationality) return null

  // Handle if nationality is already an object
  if (
    typeof userStore.userInfo.nationality === 'object' &&
    userStore.userInfo.nationality !== null
  ) {
    if (userStore.userInfo.nationality.code) {
      return userStore.userInfo.nationality
    }
  }

  // Handle if nationality is a string (country code)
  if (typeof userStore.userInfo.nationality === 'string') {
    return getCountryObject(userStore.userInfo.nationality)
  }

  return null
})

// Formatted nationality display
const formattedNationality = computed(() => {
  if (userCountry.value) {
    return userCountry.value.name || userStore.userInfo?.nationality
  }
  return userStore.userInfo?.nationality
})

// Country code for flag
const countryCode = computed(() => {
  if (userCountry.value && userCountry.value.code) {
    return userCountry.value.code
  }

  // If nationality is a string and looks like a country code
  if (
    typeof userStore.userInfo?.nationality === 'string' &&
    userStore.userInfo.nationality.length === 2
  ) {
    return userStore.userInfo.nationality
  }

  return ''
})

// Format emergency contact with proper spacing
const formattedEmergencyContact = computed(() => {
  if (!userStore.userInfo?.emergency_contact) return ''

  // Add spaces for better readability
  const nationality = userStore.userInfo?.emergency_contact_nationality || ''
  const contact = userStore.userInfo?.emergency_contact || ''

  // Format the number with proper spacing
  let formatted = contact.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')

  return `${nationality} ${formatted}`
})

// Function to handle click on the edit tooltip
const handleEditClick = () => {
  // Navigate to edit page or open edit modal
  // This can be implemented according to your application's navigation structure
  console.log('Edit profile clicked')
  // Example: router.push('/profile/edit')
}

onBeforeMount(() => {
  // Initialization logic if needed
})

// Display tooltip with delay on component mount
onMounted(() => {
  // Add a delay before showing the tooltip
  setTimeout(() => {
    showTooltip.value = true
  }, 1500) // 1.5 second delay
})
</script>

<template>
  <v-container>
    <v-row justify="center" class="pt-8">
      <v-col cols="12" sm="6" md="4">
        <div class="id-card-wrapper">
          <v-card elevation="1" class="id-card">
            <!-- Header with integrated ID number -->
            <div class="id-card-header">
              <div class="header-main">
                <div class="title-area">
                  <span class="title">TRAVELER ID</span>
                </div>
                <div class="id-number">{{ idNumber }}</div>
              </div>
            </div>

            <!-- Main content section - more compact -->
            <div class="id-card-content">
              <div class="security-text"></div>
              <!-- Left column -->
              <div class="left-column">
                <v-avatar
                  color="grey-lighten-2"
                  size="80"
                  v-if="userStore.userInfo?.user_name"
                  class="photo"
                >
                  <v-img
                    v-if="userStore.userInfo?.thumbnail_url"
                    :src="userStore.userInfo?.thumbnail_url"
                    cover
                  />
                  <span v-else class="text-h4">{{ getInitials(userStore.userInfo?.user_name) }}</span>
                </v-avatar>
                <div class="blood-type-badge" v-if="userStore.userInfo?.blood_type">
                  <div class="blood-type-header">BLOOD TYPE</div>
                  <div class="blood-type-value">{{ userStore.userInfo?.blood_type }}</div>
                  <div class="special-info" v-if="userStore.userInfo?.special_blood_type_info">
                    <div class="special-label">SPECIAL TYPE</div>
                    <div class="special-value">{{ userStore.userInfo?.special_blood_type_info }}</div>
                  </div>
                </div>
              </div>

              <!-- Right column - personal information -->
              <div class="right-column">
                <div class="info-item name">
                  <div class="value">{{ userStore.userInfo?.user_name }}</div>
                </div>

                <!-- Vertically arranged info items -->
                <div class="info-column">
                  <div class="info-item compact" v-if="userStore.userInfo?.nationality">
                    <div class="label">NATIONALITY</div>
                    <div class="value nationality-value">
                      <div class="country-flag" v-if="countryCode">
                        <img
                          :src="getCountryFlagUrl(countryCode)"
                          :alt="formattedNationality"
                          width="24"
                          height="16"
                        />
                      </div>
                      <span>{{ formattedNationality }}</span>
                    </div>
                  </div>

                  <div class="info-item compact" v-if="userStore.userInfo?.birth_date">
                    <div class="label">BIRTH DATE</div>
                    <div class="value">{{ userStore.userInfo?.birth_date }}</div>
                  </div>
                </div>

                <!-- Elegantly Redesigned Emergency Contact Section -->
                <div class="emergency-section" v-if="userStore.userInfo?.emergency_contact">
                  <div class="emergency-label">
                    <v-icon
                      icon="mdi-phone-alert"
                      color="error"
                      size="small"
                      class="emergency-icon"
                    ></v-icon>
                    <span>EMERGENCY CONTACT</span>
                  </div>
                  <a
                    :href="`tel:${userStore.userInfo?.emergency_contact_nationality}${userStore.userInfo?.emergency_contact}`"
                    class="emergency-number"
                  >
                    {{ formattedEmergencyContact }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Compact medical info section -->
            <div class="medical-info-section" v-if="userStore.userInfo?.medical_info">
              <div class="medical-header">
                <v-icon icon="mdi-medical-bag" size="small" color="info"></v-icon>
                <span>MEDICAL INFO</span>
              </div>
              <div class="medical-content">{{ userStore.userInfo?.medical_info }}</div>
            </div>
          </v-card>

          <!-- Speech bubble tooltip with animation -->
          <div
            class="speech-bubble-tooltip"
            :class="{ 'show-tooltip': showTooltip }"
            @click="router.push({name: 'my-page'})"
          >
            <span>카드 정보를 최신화 하기위해선 클릭하세요.</span>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
.id-card-wrapper {
  position: relative;
  max-width: 350px;
  margin: 0 auto;
  padding-bottom: 50px; /* Space for the tooltip */
}

/* Speech bubble tooltip with arrow */
.speech-bubble-tooltip {
  position: absolute;
  bottom: 0;
  right: 5px; /* Right-aligned */
  background-color: #4660e6; /* Blue color as in the reference */
  color: white;
  padding: 8px 16px;
  border-radius: 50px; /* Full rounded edges */
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(70, 96, 230, 0.4);
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  white-space: nowrap;
  z-index: 2;

  /* Initial state for animation */
  opacity: 0;
  transform: translateY(20px) scale(0.9);

  /* Animation state class */
  &.show-tooltip {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  /* Speech bubble arrow */
  &::after {
    content: '';
    position: absolute;
    top: -8px; /* Position at the top */
    right: 20px; /* Position toward the right side */
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid #4660e6; /* Same color as the bubble */
  }

  /* Add subtle hover effect */
  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 4px 12px rgba(70, 96, 230, 0.5);
  }

  /* Add active/press effect */
  &:active {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 1px 4px rgba(70, 96, 230, 0.5);
  }
}

.id-card {
  max-width: 350px;
  margin: 0 auto;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1) !important;
  border-radius: 8px !important;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
    transform: translateY(-2px);
  }

  &-header {
    position: relative;
    color: white;
    padding: 12px 16px;
    background: linear-gradient(135deg, #1976d2, #0d47a1);
    background-size: 300% 300%;
    animation: gradientMotion 3s ease-in-out infinite;
    overflow: hidden;

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 2;
    }

    .title-area {
      .title {
        font-size: 18px;
        font-weight: bold;
        letter-spacing: 1.5px;
      }
    }

    .id-number {
      font-size: 14px;
      letter-spacing: 1px;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 8px;
      border-radius: 4px;
    }
  }

  &-content {
    display: flex;
    padding: 16px;
    gap: 15px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: repeating-linear-gradient(
          45deg,
          rgba(0, 0, 0, 0.02) 0px,
          rgba(0, 0, 0, 0.02) 1px,
          transparent 1px,
          transparent 30px
      );
      pointer-events: none;
      z-index: 0;
    }

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: repeating-linear-gradient(
          -45deg,
          transparent 0px,
          transparent 10px,
          rgba(0, 0, 0, 0.02) 10px,
          rgba(0, 0, 0, 0.02) 12px
      );
      pointer-events: none;
      z-index: 0;
    }

    .security-text {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }

    .left-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 90px;
      position: relative;
      z-index: 1;

      .photo {
        border: 2px solid #e0e0e0;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: 3px solid white;
      }

      .blood-type-badge {
        width: 100%;
        background-color: #f44336;
        color: white;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);

        .blood-type-header {
          font-size: 9px;
          padding: 3px 0;
          background: rgba(0, 0, 0, 0.2);
          text-align: center;
          font-weight: bold;
        }

        .blood-type-value {
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          padding: 4px 0 6px;
        }

        .special-info {
          background: rgba(0, 0, 0, 0.2);
          padding: 2px 0;

          .special-label {
            font-size: 8px;
            text-align: center;
            font-weight: bold;
          }

          .special-value {
            font-size: 10px;
            text-align: center;
            padding-bottom: 2px;
            font-weight: 500;
          }
        }
      }
    }

    .right-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: relative;
      z-index: 1;

      .info-item {
        &.name {
          .value {
            font-size: 18px;
            font-weight: bold;
            color: #212121;
            padding-bottom: 3px;
            border-bottom: 1px solid #e0e0e0;
          }
        }

        &.compact {
          margin-bottom: 8px;

          .label {
            font-size: 10px;
            color: #757575;
            margin-bottom: 1px;
            font-weight: 500;
          }

          .value {
            font-size: 14px;
            font-weight: 500;

            &.nationality-value {
              display: flex;
              align-items: center;
              gap: 6px;

              .country-flag {
                width: 24px;
                height: 16px;
                overflow: hidden;
                border-radius: 2px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

                img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }
              }
            }
          }
        }
      }

      .info-column {
        display: flex;
        flex-direction: column;
      }

      .emergency-section {
        position: relative;
        padding-top: 10px;

        /* Top line decoration */
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(244, 67, 54, 0.5), transparent);
        }

        .emergency-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 5px;

          span {
            font-size: 11px;
            font-weight: 600;
            color: #d32f2f;
            letter-spacing: 0.5px;
          }

          .emergency-icon {
            margin-top: -2px;
          }
        }

        .emergency-number {
          display: block;
          padding: 8px 12px;
          border-radius: 6px;
          background-color: rgba(244, 67, 54, 0.08);
          border: 1px dashed rgba(244, 67, 54, 0.3);
          text-align: center;
          font-size: 15px;
          font-weight: 500;
          color: #d32f2f;
          text-decoration: none;
          transition: all 0.2s ease;
          letter-spacing: 0.2px;

          &:hover {
            background-color: rgba(244, 67, 54, 0.12);
            transform: scale(1.02);
          }

          &:active {
            transform: scale(0.98);
          }
        }
      }
    }
  }

  .medical-info-section {
    background-color: rgba(3, 169, 244, 0.08);
    padding: 10px 16px;
    border-left: 3px solid #03a9f4;
    position: relative;
    z-index: 1;
    margin-top: 4px;

    .medical-header {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: #0288d1;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .medical-content {
      font-size: 13px;
      line-height: 1.4;
    }
  }
}

@keyframes gradientMotion {
  0% {
    background-position: 0% 0%;
  }
  25% {
    background-position: 100% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  75% {
    background-position: 0% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}
</style>