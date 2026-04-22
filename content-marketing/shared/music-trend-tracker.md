# 음악 & 트렌드 모니터링 가이드

## 모니터링 소스 (매주 화요일 1시간 투자)

### TikTok
- **TikTok Creative Center** (https://ads.tiktok.com/business/creativecenter)
  - Trends → Sounds → Region: South Korea → 7일 / 30일 필터
  - Trends → Hashtags → Industry: Beauty / Health / Tech
  - Trends → Videos → "Top Ads"에서 광고 영상 벤치마킹
- **Inspiration** 탭에서 카테고리별 인기 영상 확인
- **For You 페이지** 직접 30분 시청 → 반복 노출되는 사운드/포맷 메모

### YouTube Shorts
- YouTube Trends 사이트 (https://trends.youtube/)
- 검색바 자동완성 (예: "AI" 입력 → 최근 검색어 노출)
- "Shorts" 탭에서 카테고리별 인기 영상

### Instagram Reels
- **Instagram Trends** (Pro 계정 인사이트 → Recent Trends)
- 인기 크리에이터 팔로우: @creators (공식 계정)
- 한국 트렌드 큐레이션: @reels.kr, @tiktokkorea

### 한국 트렌드 보조
- 큐피드라이브, 스마트스토어 인기 검색어
- 네이버 데이터랩 (https://datalab.naver.com/)
- 카카오 비즈니스 인사이트

## 트렌드 분해 4요소 워크시트

| 요소 | 체크 항목 | 메모 예시 |
|------|----------|----------|
| 사운드 | 곡 제목 / 사용 구간 (몇 초~몇 초) / BPM | "ABCD - XYZ" 0:15~0:25 / 120 BPM |
| 동작 | 키 동작 3개 / 카메라 무브 / 컷 횟수 | 손동작 → 회전 → 클로즈업 / 정적 → 줌인 / 4컷 |
| 컷 구조 | 길이 / 컷 간 전환 방식 | 21초 / 비트 매칭 컷 / 페이드 0회 |
| 텍스트 오버레이 | 위치 / 폰트 / 등장 타이밍 | 화면 상단 중앙 / 굵은 산세리프 / 0초~3초 |

## 사운드 사용 권장 룰

1. **반드시 플랫폼 라이브러리 직접 사용** — CapCut에서 mp3 임포트하지 말고 TikTok/Reels 앱 내에서 사운드 픽
2. **트렌드 사운드 사용 기간 = 등장 후 3~10일** — 너무 늦으면 도달률 ↓
3. **사용 횟수 5만 회 이상이면 이미 늦음** — 1만~5만 사이가 스위트스팟
4. **저작권 회피:** 음원 그대로 사용은 OK (플랫폼 라이센스). mp3 다운로드 후 임포트는 위험

## 트렌드 → 영상 변환 의사결정 트리

```
트렌드 발견
  ├─ 본인 얼굴 노출 가능? 
  │    ├─ Yes → 컨셉 3 모드 B (본인+AI 합성)
  │    └─ No  → 컨셉 3 모드 A or C
  ├─ 동작이 단순한가?
  │    ├─ Yes → 자체 SaaS dance-challenge / pose-transition 템플릿
  │    └─ No  → Kling 2.5 Pro i2v로 키프레임 → 영상화
  └─ 트렌드 메타 자체가 AI인가?
       └─ Yes → "AI가 따라한 트렌드" 컨셉으로 t2v (Luma Ray 2)
```

## 주간 트렌드 보드 템플릿

매주 화요일 작성, 수요일~금요일 반영.

```yaml
week: 2026-W17
captured_on: 2026-04-23

trending_sounds:
  - name: "곡명 - 아티스트"
    url: "TikTok/Reels 사운드 URL"
    usage_count: 23000
    optimal_action: "춤 동작 변형"
    target_concept: 3
    deadline: "2026-04-26"

trending_formats:
  - name: "POV: 내가 ~라면"
    sample_url: "참고 영상 URL"
    target_concept: 2
    
trending_topics:
  - name: "GPT-5 출시 루머"
    target_concept: 4
    deadline: "2026-04-24 (24시간 내)"
```

## 자동화 후보 (추후)

- ChatGPT Custom GPT로 "TikTok Creative Center URL → 트렌드 분해 4요소 자동 추출"
- Apify TikTok scraper → 매일 KR Top 100 사운드 CSV 다운로드
- Notion / Airtable에 트렌드 보드 자동 기록
