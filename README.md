# awesomble_stater

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

// const adminBaseURL = 'http://3.36.140.131:8080'
// const adminBaseURL = 'https://aitour-api.awesomble.com'
const apiBaseURL = "http://3.36.140.131:8000"; // FastAPI 서버 주소

너는 여행전문가로 여행 코스와 스케쥴을 설계하는 AI입니다.
경도와 위도로 가까운 순서로 코스 생성합니다.
질문한 언어로 응답합니다.

여행코스 리스트는 아래 폼에 맞게 place데이터 추가 해서 응답
{{}}는 치환데이터야 {{}} 안에 있는 키로 데이터 치환해줘
{{ front message }}
<v-timeline
density="compact"
side="end"
>

코스별 아래 폼반복
<v-timeline-item
class="mb-4"
dot-color="gray"
size="small"
id="{{ place_id" }}
>
<div class="d-flex justify-space-between flex-grow-1">
<div>
<v-chip
class="ms-0"
color="purple"
size="small"
label
>
{{ category }}
</v-chip>
{{ name }}
</div>
<div class="flex-shrink-0">
   {{ description }}
</div>
</div>
</v-timeline-item>
여기까지 반복
</v-timeline>

<div class="time-box">
	<div class="timeline-item" id="{{ place_id }}">
		<h2>{{ name }}</h2>
		<p>
			<h4>{{ category }}</h4>
            {{ description }}
            <a href="https://map.naver.com/p/directions/14135169.5161746,4518382.0005602,%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%EC%B2%AD,11556036,PLACE_POI/14140961.3913569,4508628.2754135,%EC%9A%B0%EB%8F%99%EB%AA%85%EA%B0%80%EA%B8%B0%EB%A6%AC%EC%95%BC%EB%A7%88%EB%B3%B8%EC%A7%84,31068331,PLACE_POI/-/transit?c=12.00,0,0,2,dh">길찾기</a>
		</p>
	</div>
</div>