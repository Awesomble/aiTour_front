// 지도 경계 타입
export interface MapBounds {
  lat_min: number | null
  lng_min: number | null
  lat_max: number | null
  lng_max: number | null
}

// 지도 정보 타입
export interface MapInfo extends MapBounds {
  lat: number | null
  lng: number | null
}

// 마커 위치 타입
export interface MarkerPosition {
  lat: number
  lng: number
}

// 마커 객체 타입
export interface MarkerObject {
  marker: any
  placeId: string
  categoryId?: number
}

// 경로 정보 타입
export interface RouteInfo {
  distance: string
  duration: string
  mode?: string
}

// 장소 정보 타입
export interface Place {
  place_id: string
  name?: string
  latitude: number
  longitude: number
  landmark_url?: string
  category?: {
    category_id: number
    icon?: string
    icon_color?: string
    min_zoom_level?: number
  }
  [key: string]: any
}

// 지도 Props 타입
export interface MapProps {
  initialCenter: { lat: number; lng: number }
  initialZoom: number
  categories: number[]
  activeCategory: number | null
}