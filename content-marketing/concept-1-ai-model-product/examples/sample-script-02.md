# Sample Script 02 — 콜라겐 젤리 야간 루틴 (트렌디)

**컨셉:** Concept 1 (AI 모델 × 제품 광고 / 건강식품)
**서브카테고리:** night-recovery
**모델:** **유나** (yuna, 20대 후반, 친근/자연스러움)
**플랫폼 타겟:** TikTok / Instagram Reels / YouTube Shorts
**길이:** 25초
**예상 소요 시간:** 40분
**예상 비용:** 약 2,000원

---

## 준비물 체크리스트

- [ ] 제품 정보
  - 제품명: `[PRODUCT_NAME]` = 예시 "글로우 콜라겐 젤리"
  - 핵심 효능: `[PRODUCT_BENEFIT]` = 예시 "피부 탄력 + 숙면 도움"
  - 형태: 스틱형 젤리 (1포)
- [ ] 제품 사진 3장
- [ ] **유나 Identity Lock 등록 완료** ([reference_images/README.md](../../shared/reference_images/README.md))
- [ ] 유나 ElevenLabs voice_id 등록 완료
- [ ] BGM 후보: CapCut "Cozy Night" 또는 "Lo-fi Sleep"

---

## 단계 1. 영상 생성 — Seedance 2.0 Identity Lock — 15분

### Seedance 2.0 대시보드:

1. **New Video → Text-to-Video**
2. **Identity Lock:** 유나 (yuna) 선택
3. **Aspect Ratio:** 9:16
4. **Duration:** 5초
5. **Reference 제품 이미지:** 정면 사진 첨부

### 영상 1 프롬프트 (영어):

```
Korean woman in her late 20s, friendly natural face, in cozy warm bedroom evening with soft amber bedside lamp glow, holding 글로우 콜라겐 젤리 stick package in hand, comfy oversized hoodie pajamas, sitting on soft fluffy bedding, peaceful relaxed gentle smile, photorealistic lifestyle photography, shallow depth of field, slow camera dolly from medium to close-up, 9:16 vertical, preserve product packaging detail
```

### Negative:
```
blurry, distorted hands, extra fingers, harsh lighting, daytime, formal setting
```

→ Generate (5초). 다운로드.

### 영상 2 (B-cut, 사용 모먼트) 프롬프트:

```
Same Korean woman in her late 20s, tears open the 글로우 콜라겐 젤리 stick package, gently squeezes the jelly into her mouth, satisfied content smile to camera, warm cinematic evening atmosphere, slow camera push-in to face close-up, 9:16 vertical
```

→ Generate (5초). 다운로드.

---

## 단계 2. 보이스 (ElevenLabs) — 3분

### 보이스 설정:
- voice_id: `shared/character-profiles.json#product_models.models[yuna].elevenlabs_voice_id`
- Stability: 0.50 (친근한 톤은 약간 낮게)
- Similarity: 0.75

### 텍스트:

**라인 1:**
```
자기 전 글로우 콜라겐 젤리 한 포. 하루 마무리 진짜 차원 다름.
```

**라인 2:**
```
피부 탄력은 기본, 숙면까지 챙김. 한 달 먹어보고 오는 길.
```

→ 2개 라인 mp3 다운로드.

---

## 단계 3. 편집 (CapCut Pro) — 20분

### 타임라인:

| 시간 | 비디오 | 자막 | 보이스 | BGM |
|------|--------|------|--------|-----|
| 0~2초 | 영상 1 줌인 정지 | "자기 전 루틴 🌙" (대형, 상단, 따뜻한 크림색) | — | -22dB |
| 2~12초 | Seedance 영상 1 (방 분위기) | "글로우 콜라겐 젤리" 모션 텍스트 | 라인 1 | -18dB |
| 12~22초 | Seedance 영상 2 (사용 모먼트) + 제품 클로즈업 인서트 | "피부 탄력 + 숙면" 자막 | 라인 2 | -18dB |
| 22~25초 | 영상 1 마지막 freeze + CTA | "프로필 링크에서 만들어보세요" | — | -18dB |

### CapCut 체크리스트:
- [ ] 자동 자막 ON + 키워드 따뜻한 크림색 (#FFF4E0) 강조
- [ ] BGM: "Cozy Night" 또는 "Lo-fi Sleep" -18dB
- [ ] 색감: 따뜻한 오렌지 톤 LUT 살짝 가산 (유나 톤 매칭)
- [ ] 워터마크 좌상단: `EP.02`
- [ ] 워터마크 우하단: `Made with sora2-video-saas`

### 내보내기:
- 1080p, 30fps, 9:16
- 파일명: `concept1_health_nightroutine_yuna_ep02_YYMMDD.mp4`

---

## 단계 4. 게시 — 5분

### 캡션 (TikTok):
```
자기 전 한 포 🌙 글로우 콜라겐 젤리
피부 탄력 + 숙면까지. AI로 만든 광고인데 어때요?

#야간루틴 #콜라겐 #건강기능식품 #영양제추천 #건강관리 #AI영상 #AI광고 #sora2
```

### 캡션 (Reels):
```
자기 전 한 포 🌙 글로우 콜라겐 젤리 👇
피부 탄력 + 숙면 둘 다 챙겨요.
프로필 링크에서 무료 100 크레딧 받기.
.
.
#야간루틴 #콜라겐 #건강기능식품 #영양제추천 #wellness #AI영상 #릴스
```

### 캡션 (Shorts):
```
야간 루틴 콜라겐 영양제 광고 60초 제작

#shorts #건강기능식품 #AI영상
```

### 게시 시각: **화요일 20:00 KST** (격주 화장품 ↔ 건강식품 → 이번 주가 건강식품)

---

## 응대 템플릿

| 댓글 | 답변 |
|------|------|
| "이 모델 누구예요?" | "유나라고 해요! AI 모델인데 시리즈 전체에서 같은 분 나올 예정이에요 😊" |
| "진짜 사람 같아요" | "Seedance 2.0 Identity Lock으로 캐릭터 일관성 잡아서 그래요!" |
| "어떻게 만들어요?" | "프로필 링크 sora2-video-saas에서 무료 100 크레딧으로 만드실 수 있어요!" |
| "제품 정보 알려주세요" | "제품은 광고 예시용이에요. 자체 SaaS로 누구나 비슷하게 만들 수 있습니다 :)" |

---

## 시리즈화 메모

유나 모델 후속 영상 후보:
- EP.04 — 유나 × 다이어트 보조제 (모닝 에너지)
- EP.07 — 유나 × 클렌징 폼 (모닝 루틴 화장품)
- EP.10 — 유나 × 프로바이오틱스 (점심 후 루틴)

→ 유나 시리즈를 8~10개 누적하면 "유나 추천 영양제 BEST" 컴필레이션 롱폼 영상 가능
