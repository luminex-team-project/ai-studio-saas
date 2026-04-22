# Sample Script 01 — 화장품 모닝 루틴 (프리미엄)

**컨셉:** Concept 1 (AI 모델 × 제품 광고 / 화장품)
**서브카테고리:** morning-routine
**모델:** **혜원** (haewon, 40대 중반, 우아/프리미엄)
**플랫폼 타겟:** TikTok / Instagram Reels / YouTube Shorts
**길이:** 25초
**예상 소요 시간:** 40분
**예상 비용:** 약 2,000원

---

## 준비물 체크리스트

- [ ] 제품 정보
  - 제품명: `[PRODUCT_NAME]` = 예시 "리뉴 글로우 앰플"
  - 핵심 효능: `[PRODUCT_BENEFIT]` = 예시 "탄력 + 광채"
- [ ] 제품 사진 3장 (정면 / 측면 / 사용 중)
- [ ] **혜원 Identity Lock 등록 완료** ([reference_images/README.md](../../shared/reference_images/README.md) 참조)
  - `seedance_identity_lock_id`: shared/character-profiles.json#product_models.models[haewon]
- [ ] 혜원 ElevenLabs voice_id 등록 완료
- [ ] BGM 후보: CapCut "Cinematic Piano" 또는 "Elegant Soft"

---

## 단계 1. 영상 생성 — Seedance 2.0 Identity Lock — 15분

### Seedance 2.0 대시보드:

1. **New Video → Text-to-Video**
2. **Identity Lock:** 혜원 (haewon) 선택
3. **Aspect Ratio:** 9:16
4. **Duration:** 5초
5. **Reference 제품 이미지:** 정면 사진 첨부 (Reference panel에 추가)

### 영상 1 프롬프트 (영어, 그대로 복붙):

```
Korean woman in her mid 40s, elegant refined face, in luxurious soft sunlit master bathroom, holding 리뉴 글로우 앰플 glass bottle in right hand, fresh dewy skin no makeup, applies single drop of ampoule onto cheek with ring fingertip in graceful slow motion, soft natural sophisticated smile, golden morning light from left window, slow camera push-in from medium to close-up, mirror reflection composition, photorealistic film grain, shot on cinematic 85mm lens, preserve product label readability, 9:16 vertical
```

### Negative:
```
blurry, distorted hands, product label change, deformed face, extra fingers, plastic skin, cheap aesthetic, casual setting
```

→ Generate (5초). 만족스러우면 다음.

### 영상 2 (B-cut, 효과 클로즈업) 프롬프트:

```
Same Korean woman in her mid 40s, extreme close-up macro shot of cheek as 리뉴 글로우 앰플 absorbs into skin, light catches the dewy texture, gentle finger pressing motion, golden morning light, premium beauty commercial cinematic, 9:16 vertical
```

→ Generate (5초). 두 영상 모두 다운로드.

---

## 단계 2. 보이스 (ElevenLabs) — 3분

### 보이스 설정:
- voice_id: `shared/character-profiles.json#product_models.models[haewon].elevenlabs_voice_id`
- Stability: 0.55
- Similarity: 0.75

### 텍스트 (한국어, 그대로 입력):

**라인 1:**
```
오늘 아침 루틴, 리뉴 글로우 앰플 한 방울로 끝났어요. 발림성, 진짜 인생 앰플.
```

**라인 2:**
```
탄력과 광채. 한 달 쓰니까 차이가 보입니다.
```

→ 2개 라인 mp3 다운로드.

---

## 단계 3. 편집 (CapCut Pro) — 20분

### 타임라인:

| 시간 | 비디오 | 자막 | 보이스 | BGM |
|------|--------|------|--------|-----|
| 0~2초 | 영상 1 정지 프레임 줌인 | "이게 진짜 AI?" (대형, 상단, 흰색+얇은 그림자) | — | -22dB |
| 2~12초 | Seedance 영상 1 | "리뉴 글로우 앰플" 모션 텍스트 (3~4초) | 라인 1 | -18dB |
| 12~22초 | Seedance 영상 2 (효과 매크로) | "탄력 + 광채" 우아한 자막 | 라인 2 | -18dB |
| 22~25초 | 영상 1 마지막 프레임 freeze | "프로필 링크에서 직접 만들어보세요" | — | -18dB |

### CapCut 체크리스트:
- [ ] 자동 자막 ON + 키워드 골드 강조 (#D4A574)
- [ ] BGM: "Cinematic Piano" 또는 "Elegant Soft" -18dB
- [ ] 색감: 베이지/골드 톤 LUT 살짝 가산 (혜원 톤 매칭)
- [ ] 워터마크 좌상단: `EP.01`
- [ ] 워터마크 우하단: `Made with sora2-video-saas`
- [ ] 마지막 프레임 0.5초 freeze (CTA 강조)

### 내보내기:
- 1080p, 30fps, 9:16
- 파일명: `concept1_cosmetic_morningroutine_haewon_ep01_YYMMDD.mp4`

---

## 단계 4. 게시 — 5분

### 캡션 (TikTok):
```
이게 AI라고? 🤍 리뉴 글로우 앰플 모닝 루틴
프리미엄 광고 60초 만에. 프로필 링크에서 직접 만들어보세요.

#모닝루틴 #스킨케어 #앰플 #안티에이징 #K뷰티 #AI영상 #AI광고 #sora2 #fyp
```

### 캡션 (Instagram Reels):
```
이게 AI라고? 🤍 리뉴 글로우 앰플 모닝 루틴 👇
프리미엄 화장품 광고 60초 만에 만들었어요.
프로필 링크에서 무료 100 크레딧으로 직접 만들어보세요.
.
.
#모닝루틴 #스킨케어 #앰플 #안티에이징 #K뷰티 #AI영상 #aibeauty #릴스
```

### 캡션 (YouTube Shorts):
```
프리미엄 화장품 광고 AI로 60초 제작

혜원 모델 + 리뉴 글로우 앰플 모닝 루틴.
프로필 링크에서 직접 만들어보세요.
#shorts #AI영상 #K뷰티 #앰플
```

### 게시 시각: **화요일 20:00 KST**

### 게시 후 30분 액션:
1. 본인 계정 좋아요 + 저장
2. X (Twitter)에 크로스 포스트
3. 첫 댓글 직접 작성: "이거 진짜 AI인지 댓글에 맞춰주세요 👀"
4. 30분 내 댓글 100% 응대

---

## 검수 리스트 (게시 전)

- [ ] 9:16 비율 확인
- [ ] 1080p 인코딩
- [ ] BGM 음량 -18dB ~ -22dB
- [ ] 보이스 -6dB
- [ ] 자막 모든 컷에 표시
- [ ] CTA 마지막 프레임에 명확
- [ ] 워터마크 2개 (EP.01 + 브랜드)
- [ ] 해시태그 8~10개
- [ ] 첫 1초 훅 강력
- [ ] **혜원 얼굴이 reference와 일치** (Identity Lock 핵심)

---

## 응대 템플릿

| 댓글 | 답변 |
|------|------|
| "이 모델 누구예요?" | "혜원이라고 해요, AI 모델입니다 ✨ 시리즈 전체에서 같은 분이 나올 거예요" |
| "진짜 사람 같아요!" | "Seedance 2.0 Identity Lock으로 만들어서 사람보다 더 일관성 있어요 :)" |
| "어떻게 만들어요?" | "프로필 링크 sora2-video-saas에서 가입하시면 무료 100 크레딧으로 만드실 수 있어요!" |
