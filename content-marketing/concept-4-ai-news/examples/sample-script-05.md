# Sample Script 05 — AI 뉴스 60초 (모델 출시 카테고리)

**컨셉:** Concept 4 (AI 뉴스 큐레이션)
**서브카테고리:** model-launch (신규 모델 출시 뉴스)
**진행자:** 본인 (HeyGen Photo Avatar) — 우하단 PIP
**플랫폼 타겟:** TikTok / YouTube Shorts / Instagram Reels
**길이:** 60초
**예상 소요 시간:** 4시간 (T+0h 뉴스 발생 → T+4h 게시 가능)
**예상 비용:** 약 7,500원

> 📌 **중요:** 이 샘플은 **실행 시점의 최신 뉴스로 변수 치환** 필요. 매주 월요일 [shared/ai-news-sources.md](../../shared/ai-news-sources.md) 점수표 30점 이상 뉴스 픽.

---

## 변수 치환 (실행 시 채우기)

| 변수 | 예시 | 본인 값 |
|------|------|--------|
| `[NEWS_TITLE]` (한글, 25자 내) | "GPT-5 정식 출시" | _______ |
| `[NEWS_URL]` | OpenAI 공식 블로그 | _______ |
| `[COMPANY]` | "OpenAI" | _______ |
| `[MODEL_NAME]` | "GPT-5" | _______ |
| `[KEY_NUMBERS]` | "벤치마크 30% 향상, 가격 동결" | _______ |
| `[KOREA_IMPACT]` | "한국어 추론 속도 2배" | _______ |
| `[MARKET_IMPACT]` | "Anthropic Claude 4 대응 발표 임박" | _______ |
| `[DATE]` | "2026-04-23" | _______ |

---

## 단계 1. 스크립트 작성 (ChatGPT) — 15분

### ChatGPT에 그대로 붙여넣기:

```
다음 AI 뉴스를 60초 한국어 숏폼 영상 스크립트로 변환해줘.

[NEWS_URL 또는 본문 붙여넣기]

요구사항:
- 총 150 단어 내외
- 구조: [0~5초 훅] [5~45초 본문 3포인트] [45~60초 CTA]
- 훅: 충격적/궁금한 한 줄 (예: "이거 진짜 미쳤음")
- 본문: ① 무엇이 달라졌나 ② 한국 사용자 영향 ③ 시장 영향
- CTA: 댓글 유도 + 채널 구독 자연스럽게
- 톤: 친근한 동네 형/누나, 존댓말. 전문 용어는 한 번 풀어 설명
- 영어 약어는 한 번씩 풀어쓰기 (예: "GPT-5, 그러니까 챗지피티 5세대")
```

### ChatGPT 출력 예시 (GPT-5 출시 가정):

> [0~5초 훅]
> 오늘 새벽 GPT-5 정식 출시됐는데, 이거 진짜 미쳤음.
>
> [5~25초 포인트 1]
> 일단 GPT-5, 그러니까 챗지피티 5세대인데요. 벤치마크 점수가 GPT-4 대비 30% 향상됐고요. 가격은 그대로예요. 같은 가격에 30% 똑똑해진 거.
>
> [25~40초 포인트 2]
> 한국 사용자 입장에서 가장 큰 변화는 한국어 추론 속도가 2배 빨라졌다는 거. 이전엔 영어 질문이 더 빨랐는데, 이젠 한국어가 더 자연스러워요.
>
> [40~50초 포인트 3]
> 시장 영향은 Anthropic이 클로드 4로 곧 대응할 거라는 루머. 이번 주 안에 발표 가능성 높음.
>
> [50~60초 CTA]
> 여러분은 GPT-5 어떻게 쓰실 건가요? 댓글로 알려주세요. 다음 영상에서는 실제 써본 후기 들고 올게요. 구독 부탁드려요.

→ 출력 검수 + 발음 어색한 단어 띄어쓰기 조정.

---

## 단계 2. HeyGen 얼굴 영상 — 5분 (생성 5~10분 대기)

### 1회 셋업 완료 가정:
- Photo Avatar 등록됨 (`shared/character-profiles.json#owner.heygen_avatar_id`)
- Voice 등록됨

### 매번 작업:
1. HeyGen 대시보드 → New Video → Avatar Video
2. Avatar 픽: 본인 Photo Avatar
3. Voice 픽: 본인 Voice (또는 기본 한국어 보이스)
4. Aspect Ratio: 9:16
5. Background: Plain white 또는 Blurred desk
6. Script 입력 (단계 1의 ChatGPT 출력 그대로)
7. 발음 어색 단어:
   - "GPT-5" → Pronunciation 수정 → "지피티 파이브"
   - "Anthropic" → "앤트로픽"
   - "Claude" → "클로드"
8. Generate → 5~10분 대기 → mp4 다운로드

→ HeyGen 영상 산출 (60초).

---

## 단계 3. Luma Ray 2 B-roll 5컷 — 30분 (병렬)

HeyGen 대기 중에 병렬로 진행. 5컷 병렬 큐.

### B-roll 1 (0~5초 훅용):
```
Macro close-up of a glowing AI processor chip on dark surface, blue and orange light pulses radiating from circuit pathways, slow rotation, cinematic film grain, vertical 9:16
```

### B-roll 2 (5~15초 포인트 1용 - 벤치마크 향상):
```
3D animated bar chart growing upward dramatically, glassmorphism style, blue glowing bars, smooth camera dolly, vertical 9:16
```

### B-roll 3 (15~30초 포인트 2용 - 한국어):
```
Korean person typing on sleek laptop, screen showing AI chat interface with Korean text streaming, soft warm desk lamp, top-down angle, vertical 9:16
```

### B-roll 4 (30~45초 포인트 3용 - 시장):
```
Floating 3D logo of [COMPANY] dissolving into particles, dark cinematic background, lens flare, vertical 9:16
```

### B-roll 5 (45~55초 CTA용 - 손/입력):
```
Hands using smartphone with AI chat app, finger taps generate animated response bubbles, soft warm lighting, top-down view, vertical 9:16
```

→ 각 5초 × 5컷 = 총 25초 B-roll 산출.

---

## 단계 4. 편집 (CapCut) — 60분

### 타임라인:

| 시간 | 메인 (75%) | PIP (25% 우하단) | 자막 | 오디오 |
|------|----------|-----------------|------|--------|
| 0~5초 | B-roll 1 (AI 칩) | — | "[NEWS_TITLE]" 대형 자막 (0~3초) | HeyGen 음성 훅 |
| 5~15초 | B-roll 2 (그래프) | HeyGen 얼굴 | "벤치마크 30% ↑" 키워드 자막 | HeyGen 포인트 1 |
| 15~30초 | B-roll 3 (한국어 입력) | HeyGen 얼굴 | "한국어 속도 2배" 강조 | HeyGen 포인트 2 |
| 30~45초 | B-roll 4 (회사 로고) | HeyGen 얼굴 | "[COMPANY] vs Anthropic" | HeyGen 포인트 3 |
| 45~55초 | HeyGen 100% (Full screen) | — | "댓글로 알려주세요" CTA | HeyGen CTA |
| 55~60초 | 워터마크 강조 | — | "Made with sora2-video-saas" | BGM 아웃트로 |

### CapCut 체크리스트:
- [ ] **자동 자막 ON** + 키워드 오렌지(#FF6B35) 강조
- [ ] HeyGen PIP은 우하단 25% 크기, 둥근 모서리
- [ ] BGM: Lo-fi Tech 또는 Future Bass -22dB (보이스 -6dB와 비교)
- [ ] 핵심 숫자 등장 시 1초 줌인 효과 (`[KEY_NUMBERS]`)
- [ ] 워터마크 좌상단: `DAY.[YYMMDD]`
- [ ] 워터마크 우하단: `Made with sora2-video-saas`
- [ ] 마지막 0.5초 freeze frame (CTA 강조)

### 내보내기:
- `concept4_ainews_modellaunch_[YYMMDD].mp4`
- 1080p, 30fps, 9:16

---

## 단계 5. 게시 — 5분

### 캡션 (TikTok):
```
[NEWS_TITLE] 정리 60초 ⚡
한국 사용자 영향까지 다 봤어요. 댓글로 의견 알려주세요!

#AI뉴스 #AI소식 #[MODEL_NAME] #[COMPANY] #AI영상 #테크뉴스 #sora2 #fyp
```

### 캡션 (Reels):
```
[NEWS_TITLE] 정리 60초 ⚡ 👇
한국 사용자 영향, 시장 변화까지.
프로필 링크에서 더 많은 AI 콘텐츠 보기.
.
.
#AI뉴스 #[MODEL_NAME] #ainews #테크뉴스 #릴스 #aitools
```

### 캡션 (Shorts):
```
[NEWS_TITLE] 60초 정리 / AI 뉴스

[3줄 본문 요약]

#shorts #AI뉴스 #[MODEL_NAME]
```

### 게시 시각:
- **권장:** 뉴스 발생 후 **12시간 이내** 즉시
- **정기:** 월요일 19:00 KST (주말 누적 뉴스 정리)

### 게시 후 30분 액션:
1. 본인 X (Twitter)에 "방금 영상 올렸어요" 크로스 포스트
2. 첫 댓글 직접 작성: "여러분은 [MODEL_NAME] 어떻게 쓰실 건가요?"
3. 30분 내 모든 댓글 응대

---

## 응대 템플릿

| 댓글 | 답변 |
|------|------|
| "정확한 정보예요?" | "[NEWS_URL] 공식 발표 기준이에요. 추가 확인하시려면 캡션 링크에서!" |
| "어떻게 매번 빨리 올려요?" | "AI 도구로 자동화했어요. 스크립트 ChatGPT, 영상 HeyGen, B-roll Luma. 자세한 워크플로우는 다음 영상에서 공개할게요!" |
| "다음 뉴스 다뤄주세요!" | "💡 좋은 추천이에요! 다음 주에 다뤄볼게요" |
| 잘못된 정보 지적 | "확인해보고 정정 영상 곧 올리겠습니다. 알려주셔서 감사해요!" → 24시간 내 정정 영상 |

---

## 시리즈 누적 전략

100회 달성 시:
- 인기 영상 TOP 10 컴필레이션 → 롱폼 영상 (10분)
- "AI 뉴스 100선" 인스타 캐러셀 포스트
- 채널 시리즈 페이지에서 카테고리별 분류
