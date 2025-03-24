import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { en } from 'vuetify/locale'

// 안드로이드 WebView 환경 감지
const isAndroidWebView = typeof window !== 'undefined' && window.AndroidInterface !== undefined

// 시스템 UI 크기 정보 가져오기
let statusBarHeight = '0px'
let navBarHeight = '0px'

// 즉시 실행 함수를 통해 초기화할 수 있는 정보 설정
if (isAndroidWebView && typeof window.AndroidInterface.getSystemInfo === 'function') {
  try {
    const systemInfo = JSON.parse(window.AndroidInterface.getSystemInfo())
    statusBarHeight = `${systemInfo.statusBarHeight / systemInfo.devicePixelRatio}px`
    navBarHeight = `${systemInfo.navigationBarHeight / systemInfo.devicePixelRatio}px`

    // 전역 CSS 변수로도 설정 (선택사항)
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--status-bar-height', statusBarHeight)
      document.documentElement.style.setProperty('--nav-bar-height', navBarHeight)
    }

    console.log('Android System UI 정보 로드됨:', { statusBarHeight, navBarHeight })
  } catch (e) {
    console.error('Android System UI 정보 로드 실패:', e)
  }
}

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'aitour',
    themes: {
      aitour: {
        colors: {
          primary: '#1483C2',
          secondary: '#fdcb6e',
          success: '#00cec9',
          warning: '#2d3436',
          background: '#fff',
          error: '#d63031',
          info: '#0984e3',
          gray: '#A0AEB5',
          white: '#ffffff',
          black: '#000000'
        },
        dark: false,
        variables: {
          // 시스템 UI 관련 변수 추가
          'status-bar-height': statusBarHeight,
          'nav-bar-height': navBarHeight,

          // Vuetify 컴포넌트의 기본 높이 재정의
          'app-bar-height': `calc(56px + ${statusBarHeight})`,
          'bottom-navigation-height': `calc(56px + ${navBarHeight})`,

          // 안전 영역 변수 (iOS 스타일로, 필요시 사용)
          'safe-area-inset-top': statusBarHeight,
          'safe-area-inset-bottom': navBarHeight
        }
      }
    }
  },
  defaults: {
    // 컴포넌트 기본 속성 설정
    VAppBar: {
      // 앱바에 상태바 높이만큼 패딩 추가
      style: isAndroidWebView ? `padding-top: ${statusBarHeight};` : ''
    },
    VBottomNavigation: {
      // 바텀 네비게이션에 네비게이션바 높이만큼 패딩 추가
      style: isAndroidWebView ? `padding-bottom: ${navBarHeight};` : ''
    }
  },
  locale: {
    locale: 'en',
    fallback: 'en',
    messages: { en }
  }
})

// App.vue나 메인 컴포넌트에서 사용할 수 있도록 시스템 UI 정보 내보내기
export const systemUi = {
  isAndroidWebView,
  statusBarHeight,
  navBarHeight
}
