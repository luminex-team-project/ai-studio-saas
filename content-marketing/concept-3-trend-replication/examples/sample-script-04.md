# Sample Script 04 — 트렌드 복제 (모드 C: 풀 AI 변환 메타)

**컨셉:** Concept 3 (트렌드 복제 / 풀 AI 변환 메타)
**모드:** C (Luma Ray 2 t2v로 트렌드를 AI 미학으로 재해석)
**플랫폼 타겟:** TikTok / Instagram Reels / YouTube Shorts
**길이:** 15초
**예상 소요 시간:** 90분
**예상 비용:** 약 2,000원

> 📌 **중요:** 이 샘플은 **실행 시점에 트렌드 모니터링 결과를 변수에 채워야** 함. 매주 화요일 [shared/music-trend-tracker.md](../../shared/music-trend-tracker.md)에 따라 트렌드 1개 픽 후 아래 변수 치환.

---

## 변수 치환 (실행 시 채우기)

| 변수 | 예시 | 본인 값 |
|------|------|--------|
| `[TREND_NAME]` | "Apple Watch Pose Challenge" | _______ |
| `[TREND_SOUND_URL]` | TikTok 사운드 링크 | _______ |
| `[TREND_REFERENCE_URL]` | 벤치마크 영상 1개 | _______ |
| `[TREND_KEY_ACTION]` (영어) | "rotating wrist showing watch face dramatically" | _______ |
| `[TREND_VIBE]` (영어) | "playful confident energetic" | _______ |
| `[VARIANT_AESTHETIC]` (영어, 픽 1개) | "cyberpunk robot" / "Pixar 3D character" / "8mm vintage film person" / "underwater diver" / "anime character" | _______ |

이 샘플에서는 **VARIANT_AESTHETIC = "cyberpunk robot"** 으로 진행 가정.

---

## 준비물 체크리스트

- [ ] 화요일 트렌드 보드에서 트렌드 1개 픽
- [ ] 트렌드 사운드 1초 분석 (BPM, 비트 위치)
- [ ] 본인 트위터/인스타에서 트렌드 사운드 미리 저장 (앱 내 사운드 픽용)
- [ ] BGM은 트렌드 사운드 직접 사용 (CapCut에서 mp3 임포트 ❌)

---

## 단계 1. 트렌드 4요소 분해 — 5분

| 요소 | 채우기 (예시) |
|------|-------------|
| 사운드 | "Apple Watch Theme" 0:08~0:18, 128 BPM |
| 동작 | 손목 회전 → 시계 클로즈업 → 화면에서 메시지 팝업 → 미소 |
| 컷 구조 | 4컷, 비트 매칭, 페이드 0회 |
| 텍스트 오버레이 | 화면 상단 "POV:" + 영어 자막 0초~3초 |

---

## 단계 2. AI 변환 컨셉 라인 작성 — 5분

```
POV: [TREND_NAME] 챌린지를 [VARIANT_AESTHETIC]가 따라한다면
```

예시: "POV: Apple Watch 챌린지를 사이버펑크 로봇이 따라한다면"

---

## 단계 3. Luma Ray 2 t2v 영상 생성 — 30분

### 영상 1 (0~5초, 트렌드 인트로)

```
A sleek cyberpunk humanoid robot with glowing neon blue circuits, mid-action of rotating its wrist showing a glowing holographic watch face dramatically, dark futuristic city alley with neon signs, playful confident energetic vibe, dynamic camera following the wrist motion, vertical 9:16, cinematic film quality
```

**Duration:** 5초

### 영상 2 (5~10초, 클라이맥스)

```
Same cyberpunk humanoid robot, holographic message bubble pops up from watch face, robot's LED face displays a confident smile pattern, dramatic lighting shift, slow motion, vertical 9:16, neon cyberpunk aesthetic
```

**Duration:** 5초

→ 각 5초 영상 산출. 부족하면 영상 3개까지 생성해서 비트 매칭.

---

## 단계 4. 편집 (CapCut) — 30분

### 타임라인:

| 시간 | 비디오 | 자막 | 오디오 |
|------|--------|------|--------|
| 0~1초 | 원본 트렌드 1초 인서트 | "AI 버전 봐봐" (대형, 상단) | 트렌드 사운드 |
| 1~6초 | Luma 영상 1 (인트로) | "POV: 로봇이 챌린지 한다면" | 트렌드 사운드 (비트 매칭) |
| 6~11초 | Luma 영상 2 (클라이맥스) | 키워드 강조 자막 | 트렌드 사운드 |
| 11~13초 | 분할 화면: 원본 vs AI | "원본 vs AI" | 트렌드 사운드 |
| 13~15초 | Luma 영상 2 정지 + CTA | "프로필 링크" | 트렌드 사운드 페이드 |

### CapCut 체크리스트:
- [ ] 트렌드 사운드는 **반드시 앱 내 사운드 픽** (CapCut에서 TikTok 사운드 ID 검색 또는 게시 시 TikTok 앱 내에서 픽)
- [ ] 비트 매칭: BPM에 맞춰 컷 (128 BPM = 0.47초 단위)
- [ ] 분할 화면 효과: 원본/AI 동시 재생
- [ ] 자막 폰트: 굵은 산세리프, 흰색 + 검정 외곽선
- [ ] 워터마크 좌상단: `TREND.W17` (주차)
- [ ] 워터마크 우하단: `Made with sora2-video-saas`

### 내보내기:
- `concept3_trend_aimeta_w17_YYMMDD.mp4`

---

## 단계 5. 게시 — 5분

### 캡션 (TikTok):
```
[TREND_NAME]을 AI가 따라하면 이렇게 됨 🤯
사이버펑크 로봇 버전 ㅋㅋㅋ
프로필 링크에서 직접 만들어봐요.

#[TREND_HASHTAG] #챌린지 #트렌드 #AI영상 #AI광고 #sora2 #fyp #추천
```

⚠️ **중요:** TikTok 게시 시 캡션 작성 후 **사운드 부분에서 원본 트렌드 사운드 직접 픽** (이게 알고리즘 부스트의 핵심).

### 캡션 (Reels):
```
[TREND_NAME]을 AI가 따라하면 이렇게 됨 🤯 👇
사이버펑크 로봇 버전 / Pixar 버전 등등 만들 수 있어요
프로필에서 sora2-video-saas로 직접 만들기
.
.
#[TREND_HASHTAG] #챌린지 #AI영상 #릴스 #trending #viral
```

### 캡션 (Shorts):
```
AI가 따라하는 트렌드 챌린지 ([TREND_NAME])

#shorts #AI영상 #챌린지 #트렌드
```

### 게시 시각: **수요일 21:00 KST** (트렌드 라이프사이클 안)

---

## 응대 템플릿

| 댓글 | 답변 |
|------|------|
| "이거 원본 어디서 봤더라" | "[TREND_NAME] 원본 영상은 캡션 해시태그에서 보실 수 있어요!" |
| "다른 버전도 만들어줘" | "💡 [Pixar / 애니 / 8mm 빈티지] 버전도 다음에 만들게요!" |
| "어떻게 만들었어요?" | "Luma Ray 2로 텍스트 한 줄 입력해서 만들었어요. 프로필 링크에서 비슷하게 가능해요!" |

---

## 트렌드 모드 변형 (이 스크립트 재사용)

같은 트렌드를 다음 주에 다른 VARIANT_AESTHETIC으로 한 번 더:

- W17: 사이버펑크 로봇
- W18: Pixar 3D 캐릭터
- W19: 8mm 빈티지 사람
- W20: 수중 다이버

→ 4주간 같은 트렌드 4가지 버전으로 시리즈화 = 알고리즘 깊이 학습 + 팔로워 시리즈 인지
