# AI 뉴스 모니터링 소스

매일 아침 30분 (월요일 1시간) 투자. 컨셉 4용.

## 1차 소스 (즉시 반영)

### X (Twitter) — 24시간 내 뉴스 90%가 여기서 시작
- @sama (Sam Altman, OpenAI)
- @AnthropicAI (Anthropic 공식)
- @OpenAI (OpenAI 공식)
- @GoogleDeepMind
- @demishassabis (Demis Hassabis, DeepMind)
- @ai_for_success (큐레이션)
- @minchoi (큐레이션)
- @rowancheung (큐레이션, 뉴스레터)
- @bindureddy (실용 AI)

**팁:** TweetDeck 또는 X 리스트로 묶어서 한 번에 모니터링.

### Reddit (1~3시간 지연, 더 깊은 토론)
- r/singularity — AGI 관련
- r/LocalLLaMA — 오픈소스 모델
- r/StableDiffusion — 이미지 생성
- r/OpenAI — 공식 발표 + 유저 리액션
- r/MachineLearning — 논문 중심

### YouTube 채널 (롱폼 분석)
- AI Explained
- Matt Wolfe
- The AI Daily Brief

## 2차 소스 (배경 + 한국 컨텍스트)

### 한국
- AI타임스 (https://www.aitimes.com/)
- 디지털데일리 AI 섹션
- 테크42, 매경 AI 코너
- 텔레그램 채널: "AI 뉴스레터", "GenAI Korea"

### 글로벌 뉴스레터
- Ben's Bites (일간)
- The Rundown AI (일간)
- TLDR AI (일간)
- Import AI (주간, Anthropic 공동창업자)

## 큐레이션 점수표 (영상화 적합도)

뉴스 1건당 5개 항목 1~10점 → 합산 30점 이상이면 영상 제작.

| 항목 | 0~10점 |
|------|--------|
| 시각화 가능성 (제품 사진/데모 영상 존재?) | |
| 한국 사용자 관심도 (한국에서 쓸 수 있는가?) | |
| 임팩트 (시장 변화 / 가격 / 성능 비교 가능?) | |
| 신선도 (24시간 이내 발생?) | |
| 차별화 (다른 채널이 아직 안 다뤘나?) | |

## 영상 스크립트 60초 구조

```
[0~5초] 훅
"오늘 새벽에 GPT-5 발표됐는데, 이거 진짜 미쳤음"
+ 화면: GPT-5 로고/스크린샷 클로즈업

[5~45초] 본문 3포인트
1. 무엇이 달라졌는가 (벤치마크 비교)
2. 일반 사용자 영향 (가격, 사용 가능 여부)
3. 한국 시장 영향

[45~60초] CTA
"여러분은 GPT-5 어떻게 쓰실 건가요? 댓글로 알려주세요.
다음 영상에서는 실제 써본 후기 들고 올게요."
+ 본인 채널 CTA (프로필 링크)
```

## 영상 제작 사이클 (뉴스 발생 → 게시까지 12시간)

```
T+0h    뉴스 발생 (X 알림)
T+1h    소스 검증 (공식 발표 / 데모 영상 확인)
T+2h    스크립트 작성 (ChatGPT 활용)
T+3h    HeyGen Avatar에 스크립트 입력 → 영상 생성 (10분)
T+4h    Luma Ray 2로 B-roll 3컷 생성 (각 5초)
T+6h    CapCut에서 합성 + 자막
T+8h    검수 + 캡션 작성
T+10h   게시
T+12h   첫 댓글 응대
```

## 위험 회피

- 사실 확인 안 된 루머는 "루머라고 명시" 필수
- 경쟁사 비방 금지 (특히 OpenAI vs Anthropic 구도)
- 스크린샷 사용 시 출처 자막 표기
- 한국어 발음 어려운 외래어는 한글 자막 병기
