export function useVibration() {
  // 직접 함수 자체를 반환합니다
  return (type: string = 'haptic') => {
    try {
      window.AndroidInterface?.vibratePattern(type)
    } catch (err: any) {
      console.error('Vibration error:', err)
    }
  }
}
