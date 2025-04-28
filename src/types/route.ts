// AITour 앱에서 사용되는 타입 정의

export interface MainCategory {
  main_category_id: number
  name: string
  icon: string
}

export interface Category {
  name: string
  description: string
  icon: string
  icon_color: string
  min_zoom_level: number
  default_usage_time: number
  main_category_id: number
  category_id: number
  main_category: MainCategory
}

export interface Hashtag {
  hashtag_id: number
  name: string
}

export interface Photo {
  photo_id: number
  url: string
  original_filename: string
  file_id: string
  is_main: boolean
}

export interface Menu {
  menu_name: string
  price: number
  description: string
  menu_category: string
  menu_id: number
}

export interface Destination {
  name: string
  address: string
  category: Category
  latitude: number
  longitude: number
  duration: number
  landmark_url: string | null
  place_id: string
  hashtags: Hashtag[]
  photos: Photo[]
  menus: Menu[]
  distance_meters: number | null
  day: string
  first_schedule: boolean
  cost: string
}

// 경로 정보를 위한 인터페이스 (별도 데이터 생성 필요)
export interface Route {
  type: 'walking' | 'bus' | 'point'
  name: string
  details?: string
  busNumbers?: string[]
}
