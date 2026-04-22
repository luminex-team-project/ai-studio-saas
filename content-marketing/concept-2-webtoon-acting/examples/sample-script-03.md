# Sample Script 03 — 웹툰 명장면 실사 연기 (변신 시퀀스)

**컨셉:** Concept 2 (웹툰/애니 명장면 실사 연기)
**서브카테고리:** transformation (변신 시퀀스)
**연기자:** 본인 얼굴 + AI 합성
**플랫폼 타겟:** TikTok / Instagram Reels / YouTube Shorts
**길이:** 20초
**예상 소요 시간:** 70분
**예상 비용:** 약 2,000원

> ⚠️ **저작권 안전선:** 원작 그대로 복제 금지. "내가 만약 이 장면에 들어간다면" 각도로 변형. 캡션에 "AI 패러디" 명시. 원작 인서트 1초 이내 + 출처 자막.

---

## 작품 선정 (이번 회차)

이 샘플에서는 **변수만 채우면 되는 템플릿** 형식. 실행 시점에 IP 결정.

**추천 IP 카테고리 (저작권 안전):**
- 한국 웹툰: "나 혼자만 레벨업", "전지적 독자 시점", "신의 탑" 등 (변신/각성 컷)
- 일본 액션 애니: "나루토" 모드 변환, "원피스" 기어 변신 등
- 게임 컷씬: "리그 오브 레전드" 챔피언 궁극기 발동 컷

**[ORIGINAL_TITLE]** 변수에 본인이 픽한 작품명 채우기.

---

## 준비물 체크리스트

- [ ] 본인 셀카 3장 (정면 / 45도 / 측면) — Discord에서 Midjourney `--cref` URL 생성 후 `shared/character-profiles.json#owner.midjourney_cref_url`에 저장 (1회만)
- [ ] 원작 명장면 클립 (10~30초) — 1초 인서트용
- [ ] 작품명 메모: `[ORIGINAL_TITLE]` = 예시 "나 혼자만 레벨업"
- [ ] 명장면 분해 (아래)
- [ ] BGM: 에픽 트레일러 BGM 또는 원작 OST 패러디

---

## 단계 1. 명장면 4요소 분해 — 5분

| 요소 | 채우기 |
|------|-------|
| OUTFIT (의상) | "black hooded cloak with silver shadow armor underneath, glowing blue rune pendant" |
| BACKGROUND (배경) | "ruined ancient stone temple, blue moonlight through cracked ceiling, swirling mist on the floor, scattered debris" |
| ACTION (동작) | "step backward defensively → cloak unfurls dynamically → both hands raised slowly → blue energy gathers in palms → eyes glow blue → energy releases outward" |
| CAMERA (카메라) | "low angle slow push-in for first 2s, then 360 orbit around character for next 2s, ending close-up on glowing eyes" |
| MOOD (분위기) | "epic cinematic, dramatic blue backlighting, film grain, motion blur" |

---

## 단계 2. 키 프레임 2장 (Midjourney v7) — 10분

### 키프레임 1: BEFORE (변신 전)
```
Cinematic shot of a Korean person in their 20s, simple modern dark hoodie, standing in ruined ancient stone temple, soft moody blue moonlight, neutral vulnerable determined expression, photorealistic film still, shot on Arri Alexa 65mm --cref [OWNER_CREF_URL] --cw 80 --ar 9:16 --v 7 --s 400
```

### 키프레임 2: AFTER (변신 후)
```
Cinematic shot of the same Korean person, black hooded cloak with silver shadow armor, glowing blue rune pendant, standing in same ruined temple, dramatic blue backlighting, intense determined expression, glowing blue eyes, photorealistic film still, shot on Arri Alexa 65mm --cref [OWNER_CREF_URL] --cw 80 --ar 9:16 --v 7 --s 400
```

→ 각 4 variants → 본인 얼굴 가장 잘 보존된 것 1장씩 픽.
→ `[KEYFRAME_BEFORE_URL]`, `[KEYFRAME_AFTER_URL]` 메모.

---

## 단계 3. 영상화 (Kling 2.5 Pro) — 15분

### 영상 1: 변신 트랜지션 (Multi-image, Kling Pro 기능)

자체 ai-studio-saas의 `selfie` 잡 (10 크레딧) 또는 Kling 직접.

**Input:**
- Start frame: `[KEYFRAME_BEFORE_URL]`
- End frame: `[KEYFRAME_AFTER_URL]`

**Prompt:**
```
Smooth dramatic transformation: subject steps backward, cloak materializes and unfurls dynamically, blue energy swirls around body, dramatic lighting shift from soft moonlight to intense blue backlight, low angle slow push-in camera, cinematic motion blur
```

**Duration:** 5초

### 영상 2: 액션 클라이맥스

**Input:** `[KEYFRAME_AFTER_URL]`

**Prompt:**
```
Subject raises both hands slowly, blue energy gathers in palms intensifying, eyes glow brighter, energy releases outward in a burst, cape flows dynamically, slow motion impact, low angle dolly out then orbit camera
```

**Duration:** 5초

→ 영상 2개 산출 (총 10초).

---

## 단계 4. 보이스 (옵션)

**옵션 A:** 무성 + 원작 OST 패러디 (가장 빠름, 와우 효과 큼)

**옵션 B:** ElevenLabs 본인 보이스 클로닝
- voice_id: `shared/character-profiles.json#owner.elevenlabs_voice_id`
- 텍스트:
```
내가 만약 [ORIGINAL_TITLE] 주인공이라면.
이 정도?
```

이 샘플에서는 **옵션 A 추천** (무성, 와우 효과 극대화).

---

## 단계 5. 편집 (CapCut) — 30분

### 타임라인:

| 시간 | 비디오 | 자막 | 오디오 |
|------|--------|------|--------|
| 0~1초 | 원작 클립 1초 인서트 | "이 장면 기억나?" + "원작: [ORIGINAL_TITLE]" 출처 자막 | 원작 사운드 1초 |
| 1~6초 | Kling 영상 1 (변신 트랜지션) | — | 에픽 BGM 빌드업 |
| 6~13초 | Kling 영상 2 (액션 클라이맥스) | — | BGM 클라이맥스 |
| 13~17초 | Kling 영상 2 후반 줌인 | "이거 진짜 사람이야?" | BGM 페이드 |
| 17~20초 | 정지 프레임 | "프로필에서 sora2-video-saas로 만들어보세요" + 작은 자막 "AI 패러디" | BGM 아웃트로 |

### CapCut 체크리스트:
- [ ] 원작 인서트 1초 이내, 출처 자막 명확
- [ ] Kling 영상 1→2 사이 글리치 트랜지션
- [ ] BGM: 에픽 트레일러 BGM (예: "Epic Battle Cinematic", -18dB)
- [ ] 음량: 원작 인서트 -12dB → Kling 영상 -18dB BGM
- [ ] 워터마크 좌상단: `SCENE.01`
- [ ] 워터마크 우하단: `Made with sora2-video-saas`
- [ ] 캡션 자막에 "AI 패러디" 명시 (저작권 보호)

### 내보내기:
- `concept2_webtoon_transform_scene01_YYMMDD.mp4`

---

## 단계 6. 게시 — 5분

### 캡션 (TikTok):
```
내가 만약 [ORIGINAL_TITLE] 주인공이라면 🌪
(AI 패러디 / 원작 출처: [작가/스튜디오])
60초 만에 만든 영상. 프로필에서 직접 만들어보세요.

#웹툰 #명장면 #실사화 #AI연기 #AI패러디 #와우모먼트 #AI영상 #sora2 #fyp
```

### 캡션 (Reels):
```
내가 만약 [ORIGINAL_TITLE] 주인공이라면 🌪 (AI 패러디) 👇
60초 만에 만든 변신씬.
프로필 링크에서 무료 100 크레딧 받기.
.
.
#웹툰 #명장면 #AI연기 #aicosplay #aiparody #와우모먼트 #릴스
```

### 게시 시각: **금요일 22:00 KST**

---

## 응대 템플릿

| 댓글 | 답변 |
|------|------|
| "어떻게 만들었어요?" | "본인 셀카 → Midjourney에서 의상 변환 → Kling으로 영상화했어요. 자세한 가이드는 프로필 링크 sora2-video-saas에!" |
| "원작이 뭐예요?" | "[ORIGINAL_TITLE]이에요! 명장면 패러디 콘텐츠라 댓글에 작품 더 추천해주시면 다음 영상으로 만들어볼게요" |
| "저작권 괜찮아요?" | "AI 패러디 형식으로 만들었고, 원작 사용은 1초 이내 + 출처 표기로 공정 사용 범위 안에서 진행했어요" |
| "다음 작품 추천!" | "💡 좋은 추천이에요! 다음 영상에서 시도해볼게요" |
