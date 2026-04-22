# Concept 1: AI 모델 × 제품 광고 (화장품/건강식품)

## 목표

자연스러운 손-제품 인터랙션. 와우 포인트는 "AI인지 모를 정도의 피부/얼굴 일관성".

## 고정 인물 3명 (Seedance 2.0 Identity Lock)

| 슬러그 | 이름 | 페르소나 | 주력 카테고리 |
|--------|------|---------|--------------|
| **yuna** | 유나 (20대 후반) | 친근/자연스러움 | 데일리 화장품, 트렌디 건강식품 |
| **jihoon** | 지훈 (30대 초반) | 스포티/프로페셔널 | 남성 화장품, 헬스 보조제 |
| **haewon** | 혜원 (40대 중반) | 우아/프리미엄 | 안티에이징, 럭셔리 보조제 |

전체 시리즈에서 이 3명만 사용. 캐릭터 일관성이 신뢰감과 브랜드 인지의 핵심.

상세 reference: [../shared/character-profiles.json](../shared/character-profiles.json) `product_models` 섹션.
이미지 파일: [../shared/reference_images/](../shared/reference_images/)

## 결과물 스펙

| 항목 | 값 |
|------|----|
| 길이 | 20~30초 |
| 비율 | 9:16 |
| 해상도 | 1080p |
| 컷 수 | 4~6컷 (3~5초 단위) |
| 보이스오버 | 한국어 1~2줄 (15~25 단어) |
| BGM | -18dB ~ -22dB |

## 도구 스택

| 단계 | 메인 도구 | 폴백 |
|------|----------|------|
| 영상 생성 | Seedance 2.0 Identity Lock (i2v 또는 t2v with reference) | Kling 2.5 Pro i2v + Midjourney `--cref` |
| 보이스 | ElevenLabs | — |
| 편집 | CapCut Pro | — |

**Seedance 2.0 Identity Lock 우선 이유:** Reference 3장 (정면/45도/측면)을 한 번 등록하면 매번 캐릭터 일관성 강하게 보존. Midjourney `--cref` 단계 생략 가능 → 워크플로우 단순화.

## 단계별 SOP

### 단계 0. 사전 준비 (1회만, 30분)

1. [reference_images/README.md](../shared/reference_images/README.md) 따라 9장 등록
2. Seedance 2.0 Identity Lock에 모델 3명 등록 → `identity_lock_id` 3개 발급 → character-profiles.json에 저장
3. ElevenLabs 보이스 3개 픽 → `voice_id` 저장

### 단계 1. 모델 픽 + 제품 정보 정리 (영상당 5분)

- 제품 사진 3장 확보 (정면 / 측면 / 사용 중)
- 제품명, 핵심 효능 1개, 타겟 연령 결정
- 모델 픽 ([../shared/character-profiles.json](../shared/character-profiles.json) `product_models.selection_guide` 참조):
  - 안티에이징/프리미엄 화장품 → **혜원**
  - 데일리 화장품 / 트렌디 건강식품 → **유나**
  - 남성 화장품 / 헬스 보조제 → **지훈**

### 단계 2. 영상 생성 — Seedance 2.0 Identity Lock (영상당 10~15분)

#### 옵션 A: t2v + Identity Lock (가장 빠름)

Seedance 2.0 대시보드에서:
1. Identity: 모델 슬러그 픽 (yuna / jihoon / haewon)
2. Mode: Text-to-Video
3. Prompt 입력 (영어 권장, prompts.json의 `seedance_prompt` 참조)
4. Duration: 5초
5. Aspect: 9:16
6. Generate

#### 옵션 B: i2v + Identity Lock (제품 포지셔닝 정확히 제어)

1. 단계 2-1: 키 프레임 이미지 생성
   - Seedance Identity Lock + 제품 사진 첨부 → 합성 키프레임 생성
   - 또는 Midjourney v7로 키프레임 생성 (제품 + 모델 ref 조합)
2. 단계 2-2: i2v
   - Seedance i2v with Identity Lock → 5초 영상
   - Negative: "blurry, distorted hands, product label change, deformed face"

**산출:** 5초 영상 1~2개 (다른 동작/앵글로 추가 컷).

**자주 실패하는 부분:**
- 제품 라벨 깨짐 → "preserve product label readability" 추가
- 손가락 7개 → 동작 큐 단순화 ("right hand only")
- 얼굴이 reference에서 멀어짐 → Identity Lock weight 올리기

### 단계 3. 보이스 — ElevenLabs (영상당 3분)

- 모델별 voice_id 고정 (시리즈 일관성):
  - yuna: 친근하고 따뜻한 20대 여성 보이스
  - jihoon: 낮고 또렷한 30대 남성 보이스
  - haewon: 풍부하고 우아한 40대 여성 보이스
- 한국어 텍스트 → 음성 변환
- 발음 어색하면 띄어쓰기 조정

**스크립트 길이:** 영상 25초 기준 50~70 단어. 보이스 25초 + 무성 1~2초 권장.

### 단계 4. 편집 — CapCut (영상당 15~25분)

**컷 구조 표준:**
```
[0~2초]   훅: 제품 클로즈업 + 1초 자막 ("이게 진짜 AI?")
[2~10초]  Seedance 영상 1: 모델 사용 장면
[10~18초] Seedance 영상 2: 효과 클로즈업 + 제품 핸드오프
[18~25초] 제품 정보 + 효능 자막
[25~30초] CTA: "프로필 링크에서 직접 만들어보세요"
```

**CapCut 체크리스트:**
- [ ] 1초 훅 자막 (대형, 화면 상단)
- [ ] 제품명 모션 텍스트 (장면 1 등장 시)
- [ ] 보이스오버 -6dB
- [ ] BGM -18dB (모델 페르소나 매칭, 아래 참조)
- [ ] 마지막 CTA 자막
- [ ] 화면 좌상단 "EP.[숫자]" 워터마크
- [ ] 화면 우하단 "Made with sora2-video-saas" 워터마크

### 단계 5. 게시 (영상당 5분)

- 캡션: brand-voice.md의 "호기심 유발 훅" + 제품 한 줄 + CTA
- 해시태그: hashtag-library.json의 `concept_1_cosmetic` 또는 `concept_1_health_supplement`
- 게시 시각: **화요일 20:00 KST**
- 게시 후 30분 액션 (platform-posting-guide.md 참조)

## 비용 예측 (영상당)

| 항목 | 비용 |
|------|------|
| Seedance 2.0 Identity Lock 5초 × 1~2개 | $1~2 (약 1,300~2,600원) |
| ElevenLabs 보이스 1~2줄 | $0.10 |
| CapCut Pro | 일할 무시 |
| **합계** | **약 1,500~3,000원 + 30분 노동** |

## 모델별 톤 가이드

### 유나 (20대 후반, 친근/자연스러움)
- 분위기: 모닝 / 데이타임 / 자취방 욕실 / 카페
- 색감: 따뜻한 화이트 + 베이지 + 옅은 핑크
- BGM: 어쿠스틱 팝, 보사노바, 인디 팝
- 카피 톤: "이거 진짜 좋아요", "오늘 아침 루틴", "솔직하게"

### 지훈 (30대 초반, 스포티/프로페셔널)
- 분위기: 헬스장 / 모던 욕실 / 사무실 / 야외 트레이닝
- 색감: 깔끔한 블랙 + 화이트 + 그레이 + 액센트 컬러
- BGM: 미니멀 일렉트로, 슬로우 비트, 워크아웃 BGM
- 카피 톤: "확실한", "트레이너 인정", "오늘부터"

### 혜원 (40대 중반, 우아/프리미엄)
- 분위기: 호텔 욕실 / 럭셔리 드레싱룸 / 햇살 좋은 카페
- 색감: 베이지 + 골드 + 따뜻한 우드 + 실버 액센트
- BGM: 미니멀 피아노, 시네마틱 어쿠스틱, 클래식 크로스오버
- 카피 톤: "30년 동안", "차이가 보입니다", "결국 답은"

## 화장품 vs 건강식품 차이

### 화장품
- 손-얼굴 인터랙션 핵심 (얼굴 클로즈업 + 손가락 동작)
- 텍스처 강조 (크림 발림성, 앰플 흡수)
- BGM: 모델 톤 매칭

### 건강식품
- 손-제품 인터랙션 + 라이프스타일 (운동/주방/책상)
- 효능 시각화 (캡슐 클로즈업 → 손바닥에 따르기)
- 효능 자막 강조 (지속 시간, 함량 등)

## 프롬프트 라이브러리

[prompts.json](prompts.json)에 카테고리별 + 모델별 즉시 사용 가능한 프롬프트 트리.

## 즉시 실행 샘플

- [examples/sample-script-01.md](examples/sample-script-01.md) — 화장품 모닝 루틴 (혜원 모델, 프리미엄)
- [examples/sample-script-02.md](examples/sample-script-02.md) — 콜라겐 젤리 야간 루틴 (유나 모델, 트렌디)
