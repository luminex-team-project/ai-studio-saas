# Reference Images — Concept 1 Product Models

Concept 1 (제품 광고)에서 사용하는 **고정 인물 3명**의 Seedance 2.0 Identity Lock 레퍼런스 이미지 보관 폴더.

## 모델 3명

| 슬러그 | 이름 | 페르소나 | 주력 카테고리 |
|--------|------|---------|--------------|
| yuna | 유나 (20대 후반 여성) | 친근/자연스러움 | 데일리 화장품, 트렌디 건강식품 |
| jihoon | 지훈 (30대 초반 남성) | 스포티/프로페셔널 | 남성 화장품, 헬스 보조제 |
| haewon | 혜원 (40대 중반 여성) | 우아/프리미엄 | 안티에이징, 럭셔리 보조제 |

## 파일 명명 규칙

각 모델당 정면/45도/측면 3장 = 총 9장.

```
yuna_front.jpg
yuna_three_quarter.jpg
yuna_side.jpg

jihoon_front.jpg
jihoon_three_quarter.jpg
jihoon_side.jpg

haewon_front.jpg
haewon_three_quarter.jpg
haewon_side.jpg
```

## 등록 절차 (1회만)

### 1. 이 폴더에 9장 저장

위 9개 파일명으로 저장 (대화에서 받은 reference 3장씩 분할).

### 2. Seedance 2.0 Identity Lock 등록

각 모델당:
1. Seedance 2.0 대시보드 → Identity Lock → New Identity
2. 이름: `yuna` / `jihoon` / `haewon`
3. 정면/45도/측면 3장 업로드
4. Generate Identity Lock → `identity_lock_id` 발급
5. [../character-profiles.json](../character-profiles.json)의 `product_models.models[].seedance_identity_lock_id`에 저장

### 3. Midjourney --cref URL 백업 (보조용)

각 모델 정면 사진을 Discord에 업로드 → URL 복사 → `midjourney_cref_url` 필드에 저장.

Seedance가 다운/제한될 때 Midjourney `--cref` + Kling i2v 폴백으로 사용.

### 4. ElevenLabs 보이스 매칭

각 모델 페르소나에 맞는 한국어 보이스 3개 픽:
- yuna: 친근하고 따뜻한 20대 여성 보이스
- jihoon: 낮고 또렷한 30대 남성 보이스
- haewon: 풍부하고 우아한 40대 여성 보이스

`voice_id` 필드에 저장 → 모든 시리즈에서 일관된 톤 유지.

## 주의사항

- **이미지 변경 금지** — 한 번 등록하면 시리즈 전체 일관성을 위해 절대 다른 셋으로 교체하지 않음
- **저작권** — 이 이미지들이 AI 생성물인 경우, 생성 도구의 상업적 사용 약관 확인 (Imagen/Midjourney 모두 유료 플랜은 상업적 사용 가능)
- **백업** — 9장 이미지는 별도 클라우드 (Google Drive 등)에 백업
