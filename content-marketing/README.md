# Content Marketing System — ai-studio-saas

ai-studio-saas (sora2-video-saas) 플랫폼 홍보를 위한 4-컨셉 숏폼 콘텐츠 운영 시스템.

## 목적

1. **포트폴리오 축적** — 자체 SaaS로 만든 영상을 숏폼에 누적 → 실력 증명
2. **자체 플랫폼 도그푸딩** — Kling 2.5 Pro / Luma Ray 2 / Runway Gen-4 라우팅을 실전 검증
3. **유료 고객 유입** — 영상 → 프로필 링크 → 가입 → 무료 100 크레딧 → 유료 전환

## 4가지 컨셉

| # | 컨셉 | 핵심 가치 | 주력 도구 | 폴더 |
|---|------|----------|-----------|------|
| 1 | AI 모델 × 제품 광고 (화장품/건강식품) | 자연스러운 손-제품 인터랙션, 피부 일관성 | Midjourney + Kling 2.5 Pro + ElevenLabs | [concept-1-ai-model-product/](concept-1-ai-model-product/) |
| 2 | 웹툰/애니 명장면 실사 연기 | 본인 얼굴 일관성 + 다이내믹 액션 | Midjourney `--cref` + Kling i2v + HeyGen | [concept-2-webtoon-acting/](concept-2-webtoon-acting/) |
| 3 | TikTok/Reels/Shorts 트렌드 복제 | 24시간 이내 발행 = 알고리즘 노출 | 자체 SaaS templates + Kling/Luma | [concept-3-trend-replication/](concept-3-trend-replication/) |
| 4 | AI 핫이슈/뉴스 빠른 큐레이션 | 12시간 이내 발행, 60초 요약 | HeyGen Avatar + Luma t2v B-roll + CapCut | [concept-4-ai-news/](concept-4-ai-news/) |

## 도구 스택 & 월 예산

| 도구 | 역할 | 월 비용 (USD) |
|------|------|--------------|
| 자체 ai-studio-saas | i2v 메인 (Kling 2.5 Pro), 셀피/제품 잡 | 자체 크레딧 |
| Midjourney v7 | 캐릭터 시드 + 키 프레임 (`--cref`/`--sref`) | $30 |
| ChatGPT Plus | 스크립트 작성, 뉴스 요약 | $20 |
| ElevenLabs Creator | 한국어 보이스 + 본인 보이스 클로닝 | $22 |
| HeyGen Creator | Photo Avatar (컨셉 4 얼굴 영상) | $24 |
| CapCut Pro | 자막/BGM/모션텍스트 편집 | $10 |
| Sora/Veo 3 추가 크레딧 | B-roll 고퀄 영상 | $30~50 |
| **합계** | | **$136~156/월 (약 18~22만원)** |

## 30일 게시 캘린더

**주 5회 (월 20개) 기준 — 컨셉별 주 1회 분배:**

| 요일 | 컨셉 | 게시 시각 (KST) | 비고 |
|------|------|----------------|------|
| 월 | #4 AI 뉴스 | 19:00 | 주말 동안 쌓인 뉴스 정리 |
| 화 | #1 제품 광고 | 20:00 | 화장품 ↔ 건강식품 격주 |
| 수 | #3 트렌드 복제 | 21:00 | 화요일 트렌드 모니터링 결과 반영 |
| 목 | #1 또는 #2 | 19:00 | 제품 신상 vs 명장면 |
| 금 | #2 웹툰 명장면 | 22:00 | 주말 시청자 노린 와우 모먼트 |
| 토~일 | 휴무 또는 백업 게시 | — | 다음 주 트렌드 모니터링 |

## KPI

| 시점 | 팔로워 | 평균 조회수 | 사이트 클릭 | 유료 전환 / MRR |
|------|--------|------------|------------|----------------|
| 1개월 | 1,000 | 5,000 | 200 | 5명 / 50,000원 |
| 3개월 | 10,000 | 30,000 | 2,000 | 30명 / 750,000원 |
| 6개월 | 50,000 | 100,000 | 10,000 | 120명 / 3,000,000원 |

## 워크플로우 흐름 (공통)

```
[월요일 아침]   → 트렌드 + AI 뉴스 모니터링 (1시간)
[월~금 오전]   → 당일 컨셉 prompts.json에서 템플릿 선택 → 변수 채우기
[월~금 오후]   → 이미지 생성 (Midjourney) → 영상 생성 (Kling/Luma) → 보이스 → 편집
[월~금 저녁]   → 게시 + 첫 1시간 댓글 응대 (알고리즘 부스트)
[금요일 저녁]   → 주간 KPI 리뷰 → 다음 주 캘린더 조정
```

## 폴더 구조

```
content-marketing/
├── README.md                              ← 이 파일
├── shared/                                ← 4컨셉 공통 자산
│   ├── character-profiles.json           ← 본인 셀카 시드 + AI 모델 6명
│   ├── hashtag-library.json              ← 플랫폼 × 컨셉 해시태그
│   ├── platform-posting-guide.md         ← TikTok/Shorts/Reels 차이
│   ├── music-trend-tracker.md            ← 트렌드 사운드 모니터링
│   ├── ai-news-sources.md                ← AI 뉴스 모니터링 소스
│   └── brand-voice.md                    ← 캡션 톤매너 + CTA 풀
├── concept-1-ai-model-product/
│   ├── workflow.md
│   ├── prompts.json
│   └── examples/
│       ├── sample-script-01.md           ← 화장품 모닝 루틴
│       └── sample-script-02.md           ← 콜라겐 젤리 야간 루틴
├── concept-2-webtoon-acting/
│   ├── workflow.md
│   ├── prompts.json
│   └── examples/sample-script-03.md
├── concept-3-trend-replication/
│   ├── workflow.md
│   ├── prompts.json
│   └── examples/sample-script-04.md
└── concept-4-ai-news/
    ├── workflow.md
    ├── prompts.json
    └── examples/sample-script-05.md
```

## 시작 가이드

1. [shared/character-profiles.json](shared/character-profiles.json)을 열어 본인 셀카 URL을 채운다 (HeyGen Avatar ID + Midjourney `--cref` 시드 URL)
2. [shared/brand-voice.md](shared/brand-voice.md)에서 톤매너를 픽한다
3. 첫 주는 [examples/sample-script-01.md](concept-1-ai-model-product/examples/sample-script-01.md)부터 순서대로 실행
4. 5개 다 만든 뒤 다음 주는 `prompts.json`의 다른 카테고리로 변형 생성
5. 매 주 금요일 저녁 30분 = KPI 회고 + 다음 주 캘린더 정리

## 자체 플랫폼 연계

이 라이브러리의 `prompts.json` 스키마는 자체 SaaS의 `templates` 테이블 ([supabase/migrations/](../supabase/migrations/))과 호환되도록 설계됨. 추후 "프롬프트 마켓플레이스" 기능 출시 시 그대로 시드 데이터로 import 가능.

크레딧 비용 참조: [src/lib/payments/plans.ts](../src/lib/payments/plans.ts) — selfie 10 크레딧 / product 25 크레딧.
