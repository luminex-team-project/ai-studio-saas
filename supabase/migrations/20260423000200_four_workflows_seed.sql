-- Seed data for the 4-workflow redesign.
-- Idempotent inserts (on conflict update) so re-running migrations is safe.

-- ═══════════════════════════════════════════════════════════════
-- 1. product_models — 3 fixed identities for Concept 1 commercial ads.
--    Reference images live in the 'templates' public bucket:
--      templates/product-models/{slug}/{front,three_quarter,side}.jpg
--    Upload the 9 images manually, then the UI resolves via public URLs.
--    Seedance/Midjourney/ElevenLabs IDs stay null until registered.
-- ═══════════════════════════════════════════════════════════════

insert into public.product_models
  (slug, display_name, age_label, persona, physical_description, brand_tone,
   best_for, reference_front_path, reference_three_quarter_path, reference_side_path,
   display_order)
values
  ('yuna', '유나', '20대 후반', '친근/자연스러움',
   '검은 단발 (어깨선), 자연 메이크업, 따뜻한 미소, 베이지 니트 + 청바지 (캐주얼)',
   '친근한 동네 언니, 진솔한 추천 톤',
   array[
     '데일리 화장품 (수분크림, 클렌저, 선크림)',
     '트렌디 건강식품 (콜라겐 젤리, 다이어트 보조제, 프로바이오틱스)',
     'Z세대~밀레니얼 타깃',
     '캐주얼한 라이프스타일 광고'
   ],
   'product-models/yuna/front.jpg',
   'product-models/yuna/three_quarter.jpg',
   'product-models/yuna/side.jpg',
   1),

  ('jihoon', '지훈', '30대 초반', '스포티/프로페셔널',
   '짧은 검은 머리, 또렷한 이목구비, 운동한 체격, 화이트 티 + 검정 바지 (미니멀)',
   '신뢰감 있는 트레이너/전문가 톤',
   array[
     '남성 화장품 (스킨, 로션, 클렌징, 쉐이빙)',
     '헬스 보조제 (프로틴, BCAA, 부스터)',
     '스포츠 음료 / 에너지 드링크',
     '남성 그루밍 제품'
   ],
   'product-models/jihoon/front.jpg',
   'product-models/jihoon/three_quarter.jpg',
   'product-models/jihoon/side.jpg',
   2),

  ('haewon', '혜원', '40대 중반', '우아/프리미엄',
   '갈색 웨이브 미디엄 헤어, 성숙한 미소, 아이보리 실크 블라우스 + 그레이 슬랙스 (프리미엄)',
   '우아하고 차분한 큐레이터 톤, 신뢰감',
   array[
     '프리미엄 화장품 (안티에이징, 앰플, 아이크림)',
     '럭셔리 보조제 (콜라겐, NMN, 프리미엄 비타민)',
     '고가 라인 (럭셔리 향수, 헤어케어)',
     '30~50대 여성 타깃'
   ],
   'product-models/haewon/front.jpg',
   'product-models/haewon/three_quarter.jpg',
   'product-models/haewon/side.jpg',
   3)
on conflict (slug) do update set
  display_name = excluded.display_name,
  age_label = excluded.age_label,
  persona = excluded.persona,
  physical_description = excluded.physical_description,
  brand_tone = excluded.brand_tone,
  best_for = excluded.best_for,
  reference_front_path = excluded.reference_front_path,
  reference_three_quarter_path = excluded.reference_three_quarter_path,
  reference_side_path = excluded.reference_side_path,
  display_order = excluded.display_order,
  updated_at = now();

-- ═══════════════════════════════════════════════════════════════
-- 2. prompt_templates — seeds for all 4 concepts.
--    Mirrors content-marketing/concept-[1-4]/prompts.json at the time
--    of writing. Admin UI will be able to add/edit/disable going forward.
-- ═══════════════════════════════════════════════════════════════

-- Concept 1: ai-model-product (화장품 / 건강식품) ─────────────────
insert into public.prompt_templates
  (concept_id, concept_name, category, subcategory, display_name, description,
   duration_sec, platform_target, recommended_model_slugs, stages, variables,
   caption_template, hashtags_pool, display_order)
values
  (1, 'ai-model-product', 'cosmetic', 'morning-routine',
   '화장품 모닝 루틴', '자연스러운 손-제품 인터랙션, 피부 일관성 강조',
   25, array['tiktok','shorts','reels'], array['yuna','haewon'],
   '[
     {"stage":"video-generation-primary","tool":"seedance-2.0-identity-lock","mode":"t2v","prompt":"Korean woman early morning in soft sunlit bathroom, holding [PRODUCT_NAME] cream jar, fresh skin no makeup, gently scoops cream with ring finger and applies onto cheek with circular motion, slow camera push-in, mirror reflection composition, photorealistic film grain, 9:16 vertical","duration":5,"negative":"blurry, distorted hands, product label change, deformed face, extra fingers"},
     {"stage":"voice-line-1","tool":"elevenlabs","script":"오늘 아침 루틴, [PRODUCT_NAME] 하나로 끝났어요. 발림성 진짜 인생크림."},
     {"stage":"voice-line-2","tool":"elevenlabs","script":"[PRODUCT_BENEFIT] 효과는 한 달 쓰니까 확실히 보여요."},
     {"stage":"edit","tool":"capcut","checklist":["[0~2초] 훅 자막","[2~12초] 영상 1 + 보이스 1","[12~22초] 영상 2 + 보이스 2","[22~28초] CTA","BGM 모델 톤 매칭 -18dB","워터마크"]}
   ]'::jsonb,
   '{"PRODUCT_NAME":"제품명","PRODUCT_BENEFIT":"핵심 효능","MODEL_SLUG":"yuna | haewon"}'::jsonb,
   '이게 AI라고? 🤍 [PRODUCT_NAME] 모닝 루틴',
   'shared/hashtag-library.json#concept_tags.concept_1_cosmetic',
   1),

  (1, 'ai-model-product', 'cosmetic', 'before-after',
   '화장품 비포/애프터', '모델 변화 전후 비교 트랜지션',
   20, array['tiktok','shorts','reels'], array['haewon'],
   '[
     {"stage":"video-generation","tool":"seedance-2.0-identity-lock","mode":"t2v","prompt":"Korean woman, smooth transition from tired morning face to glowing radiant skin with confident smile, [PRODUCT_NAME] held in hand throughout, golden hour lighting shift, professional beauty commercial, 9:16","duration":5},
     {"stage":"voice","tool":"elevenlabs","script":"2주 썼더니 진짜 달라졌어요. [PRODUCT_BENEFIT] 이 정도면 인정."}
   ]'::jsonb,
   '{"PRODUCT_NAME":"제품명","PRODUCT_BENEFIT":"핵심 효능","MODEL_SLUG":"haewon"}'::jsonb,
   '2주 비교샷 충격 😱 [PRODUCT_NAME]',
   'shared/hashtag-library.json#concept_tags.concept_1_cosmetic',
   2),

  (1, 'ai-model-product', 'cosmetic', 'ingredient-closeup',
   '화장품 인그리디언트 클로즈업', '텍스처/성분 매크로 샷',
   18, array['tiktok','shorts','reels'], array['haewon'],
   '[
     {"stage":"video-generation","tool":"seedance-2.0-identity-lock","mode":"t2v","prompt":"Macro shot of Korean womans hand scooping [PRODUCT_NAME] cream, viscous glossy texture stretches between fingers slow motion, light reflects on cream, premium beauty commercial macro lens, 9:16","duration":5},
     {"stage":"voice","tool":"elevenlabs","script":"[PRODUCT_NAME], 핵심은 이 텍스처. [PRODUCT_BENEFIT] 진짜 다르더라고요."}
   ]'::jsonb,
   '{"PRODUCT_NAME":"제품명","PRODUCT_BENEFIT":"핵심 효능","MODEL_SLUG":"haewon"}'::jsonb,
   '이 텍스처 보세요 ✨ [PRODUCT_NAME]',
   'shared/hashtag-library.json#concept_tags.concept_1_cosmetic',
   3),

  (1, 'ai-model-product', 'cosmetic', 'male-grooming',
   '남성 화장품 그루밍', '미니멀 욕실 + 자신감 있는 사용 샷',
   22, array['tiktok','shorts','reels'], array['jihoon'],
   '[
     {"stage":"video-generation","tool":"seedance-2.0-identity-lock","mode":"t2v","prompt":"Korean man in modern minimal bathroom, applying [PRODUCT_NAME] onto face with palm pressing motion, athletic shoulders visible, soft cool morning light, confident expression, photorealistic, 9:16","duration":5,"negative":"feminine pose, soft lighting, distorted hands"},
     {"stage":"voice","tool":"elevenlabs","script":"[PRODUCT_NAME] 한 달 써본 결과. 남자 피부도 [PRODUCT_BENEFIT] 챙겨야죠."}
   ]'::jsonb,
   '{"PRODUCT_NAME":"제품명","PRODUCT_BENEFIT":"핵심 효능","MODEL_SLUG":"jihoon"}'::jsonb,
   '남자 스킨케어 진심 🧴 [PRODUCT_NAME]',
   'shared/hashtag-library.json#concept_tags.concept_1_cosmetic',
   4),

  (1, 'ai-model-product', 'health-supplement', 'morning-energy',
   '건강식품 모닝 에너지', '아침 캡슐 섭취 + 하루 시작',
   22, array['tiktok','shorts','reels'], array['yuna','jihoon'],
   '[
     {"stage":"video-generation","tool":"seedance-2.0-identity-lock","mode":"t2v","prompt":"Korean person in bright morning kitchen, holding [PRODUCT_NAME] bottle, pours two capsules into palm, takes them with water, fresh energetic smile, natural soft window light, slow dolly, photorealistic, 9:16","duration":5},
     {"stage":"voice","tool":"elevenlabs","script":"아침에 [PRODUCT_NAME] 두 알. 오늘도 [PRODUCT_BENEFIT] 풀파워."}
   ]'::jsonb,
   '{"PRODUCT_NAME":"제품명","PRODUCT_BENEFIT":"핵심 효능","MODEL_SLUG":"yuna | jihoon"}'::jsonb,
   '모닝 루틴 한 알 ⚡ [PRODUCT_NAME]',
   'shared/hashtag-library.json#concept_tags.concept_1_health_supplement',
   5),

  (1, 'ai-model-product', 'health-supplement', 'night-recovery',
   '건강식품 야간 회복', '자기 전 젤리/포 섭취',
   25, array['tiktok','shorts','reels'], array['yuna','haewon'],
   '[
     {"stage":"video-generation","tool":"seedance-2.0-identity-lock","mode":"t2v","prompt":"Korean woman in cozy bedroom evening with warm lamp glow, opens [PRODUCT_NAME] package, takes a jelly stick, peaceful relaxed smile, comfy pajamas, warm cinematic atmosphere, slow dolly, 9:16","duration":5},
     {"stage":"voice","tool":"elevenlabs","script":"자기 전 [PRODUCT_NAME] 한 포. [PRODUCT_BENEFIT] 진짜 차원 달라요."}
   ]'::jsonb,
   '{"PRODUCT_NAME":"제품명","PRODUCT_BENEFIT":"핵심 효능","MODEL_SLUG":"yuna | haewon"}'::jsonb,
   '자기 전 루틴 🌙 [PRODUCT_NAME]',
   'shared/hashtag-library.json#concept_tags.concept_1_health_supplement',
   6),

  (1, 'ai-model-product', 'health-supplement', 'unboxing-review',
   '건강식품 언박싱 리뷰', '미니멀 데스크 + 제품 개봉 리액션',
   28, array['tiktok','shorts','reels'], array['yuna'],
   '[
     {"stage":"video-generation","tool":"seedance-2.0-identity-lock","mode":"t2v","prompt":"Korean woman at minimal white desk, opens [PRODUCT_NAME] package with excited expression, lifts product out, examines details, top-down then face close-up, clean studio lifestyle, 9:16","duration":5},
     {"stage":"voice","tool":"elevenlabs","script":"[PRODUCT_NAME] 처음 받아봤는데 패키지부터 진심이에요. [PRODUCT_BENEFIT] 기대됨."}
   ]'::jsonb,
   '{"PRODUCT_NAME":"제품명","PRODUCT_BENEFIT":"핵심 효능","MODEL_SLUG":"yuna"}'::jsonb,
   '내돈내산 솔직 후기 📦 [PRODUCT_NAME]',
   'shared/hashtag-library.json#concept_tags.concept_1_health_supplement',
   7),

  (1, 'ai-model-product', 'health-supplement', 'sport-protein',
   '스포츠 프로틴 운동 후', '헬스장 + 쉐이커 섭취',
   25, array['tiktok','shorts','reels'], array['jihoon'],
   '[
     {"stage":"video-generation","tool":"seedance-2.0-identity-lock","mode":"t2v","prompt":"Korean athletic man post-workout in modern gym, scoops [PRODUCT_NAME] powder into shaker, shakes, takes a sip with focused expression, dynamic gym lighting, slight motion blur, 9:16","duration":5},
     {"stage":"voice","tool":"elevenlabs","script":"운동 후 [PRODUCT_NAME] 한 스쿱. [PRODUCT_BENEFIT] 진짜 차이 남."}
   ]'::jsonb,
   '{"PRODUCT_NAME":"제품명","PRODUCT_BENEFIT":"핵심 효능","MODEL_SLUG":"jihoon"}'::jsonb,
   '운동 후 한 스쿱 💪 [PRODUCT_NAME]',
   'shared/hashtag-library.json#concept_tags.concept_1_health_supplement',
   8)
on conflict (concept_id, subcategory, category) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  duration_sec = excluded.duration_sec,
  platform_target = excluded.platform_target,
  recommended_model_slugs = excluded.recommended_model_slugs,
  stages = excluded.stages,
  variables = excluded.variables,
  caption_template = excluded.caption_template,
  hashtags_pool = excluded.hashtags_pool,
  display_order = excluded.display_order,
  updated_at = now();

-- Concept 2: webtoon-acting ─────────────────────────────────────
insert into public.prompt_templates
  (concept_id, concept_name, category, subcategory, display_name, description,
   duration_sec, platform_target, stages, variables, caption_template,
   hashtags_pool, display_order)
values
  (2, 'webtoon-acting', 'archetype', 'transformation',
   '변신/각성 시퀀스', '본인 얼굴 + 의상/배경 변신으로 와우 모먼트',
   20, array['tiktok','shorts','reels'],
   '[
     {"stage":"keyframe-before","tool":"midjourney-v7","prompt":"Cinematic shot of Korean person, [BEFORE_OUTFIT], standing in [BACKGROUND], soft moody lighting, vulnerable expression, photorealistic film still, shot on Arri Alexa","params":"--cref [OWNER_CREF_URL] --cw 80 --ar 9:16 --v 7 --s 400"},
     {"stage":"keyframe-after","tool":"midjourney-v7","prompt":"Cinematic shot of same Korean person, [OUTFIT], in [BACKGROUND], dramatic backlighting, intense determined expression, glowing eyes, photorealistic film still, shot on Arri Alexa","params":"--cref [OWNER_CREF_URL] --cw 80 --ar 9:16 --v 7 --s 400"},
     {"stage":"video-multi","tool":"kling-2.5-pro-multi","prompt":"Smooth transformation sequence: [ACTION], [CAMERA], dramatic lighting shift, cinematic motion blur","duration":5},
     {"stage":"voice","tool":"elevenlabs-clone","script":"내가 만약 [ORIGINAL_TITLE] 주인공이라면. 이 정도?"}
   ]'::jsonb,
   '{"OWNER_CREF_URL":"본인 셀카 URL","OUTFIT":"의상 영어 묘사","BACKGROUND":"배경 영어 묘사","ACTION":"동작 시퀀스","CAMERA":"카메라 무브","ORIGINAL_TITLE":"원작 작품명"}'::jsonb,
   '내가 만약 [ORIGINAL_TITLE] 주인공이라면 🌪 (AI 패러디)',
   'shared/hashtag-library.json#concept_tags.concept_2_webtoon',
   1),

  (2, 'webtoon-acting', 'archetype', 'emotional-closeup',
   '감정 클로즈업', '눈물/결의 극단 클로즈업',
   15, array['tiktok','shorts','reels'],
   '[
     {"stage":"keyframe","tool":"midjourney-v7","prompt":"Extreme close-up cinematic shot of Korean persons face, [MOOD], [BACKGROUND bokeh], rim lighting, photorealistic film still, 85mm lens shallow DOF","params":"--cref [OWNER_CREF_URL] --cw 90 --ar 9:16 --v 7 --s 350"},
     {"stage":"video","tool":"kling-2.5-pro-i2v","prompt":"Single tear rolls down cheek, lip quivers, eyes blink slowly, micro-expression shift, very slow push-in to extreme close-up of eyes","duration":5},
     {"stage":"voice","tool":"elevenlabs-clone","script":"그 장면, 진짜였으면 어땠을까."}
   ]'::jsonb,
   '{"OWNER_CREF_URL":"본인 셀카 URL","MOOD":"감정 영어 묘사","BACKGROUND":"배경 영어","ORIGINAL_TITLE":"원작명"}'::jsonb,
   '이 컷 보면 눈물 남 🥲 [ORIGINAL_TITLE] (AI)',
   'shared/hashtag-library.json#concept_tags.concept_2_webtoon',
   2),

  (2, 'webtoon-acting', 'archetype', 'action-combat',
   '액션 전투 시퀀스', '다이내믹 카메라 + 전투 포즈',
   22, array['tiktok','shorts','reels'],
   '[
     {"stage":"keyframe-1","tool":"midjourney-v7","prompt":"Mid-action shot of Korean fighter, [OUTFIT], [WEAPON or martial arts pose], [BACKGROUND arena], dust particles, dramatic lighting, photorealistic film still","params":"--cref [OWNER_CREF_URL] --cw 80 --ar 9:16 --v 7 --s 400"},
     {"stage":"video-1","tool":"kling-2.5-pro-i2v","prompt":"Fighter executes powerful spinning strike, dust debris fly, 180 degree orbit, slow-mo 60fps","duration":5},
     {"stage":"video-2","tool":"kling-2.5-pro-i2v","prompt":"Fighter dodges attack with backflip, lands in fighting stance, low angle dolly, cinematic slow-mo","duration":5}
   ]'::jsonb,
   '{"OWNER_CREF_URL":"본인 셀카 URL","OUTFIT":"전투 의상","WEAPON":"무기 or 맨몸","BACKGROUND":"전장 배경","ORIGINAL_TITLE":"원작명"}'::jsonb,
   '이 액션 따라하기 미친 짓 ⚔️ [ORIGINAL_TITLE]',
   'shared/hashtag-library.json#concept_tags.concept_2_webtoon',
   3),

  (2, 'webtoon-acting', 'archetype', 'flashback-melancholy',
   '회상 장면', '골든아워 감성 회상',
   18, array['tiktok','shorts','reels'],
   '[
     {"stage":"keyframe","tool":"midjourney-v7","prompt":"Cinematic shot of Korean person, [OUTFIT], in [BACKGROUND meaningful place], golden hour warm light, wistful expression, soft film grain, Wong Kar-wai color grading, photorealistic","params":"--cref [OWNER_CREF_URL] --cw 85 --ar 9:16 --v 7 --s 350"},
     {"stage":"video","tool":"kling-2.5-pro-i2v","prompt":"Subject turns slowly to camera, soft melancholic smile, wind catches hair, golden light shifts, slow handheld dolly, dreamlike","duration":5},
     {"stage":"voice","tool":"elevenlabs-clone","script":"그때로 다시 돌아갈 수 있다면."}
   ]'::jsonb,
   '{"OWNER_CREF_URL":"본인 셀카 URL","OUTFIT":"회상 의상","BACKGROUND":"장소","ORIGINAL_TITLE":"원작명"}'::jsonb,
   '이 회상씬 분위기 진짜 ✨ [ORIGINAL_TITLE]',
   'shared/hashtag-library.json#concept_tags.concept_2_webtoon',
   4)
on conflict (concept_id, subcategory, category) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  duration_sec = excluded.duration_sec,
  stages = excluded.stages,
  variables = excluded.variables,
  caption_template = excluded.caption_template,
  display_order = excluded.display_order,
  updated_at = now();

-- Concept 3: trend-replication ──────────────────────────────────
insert into public.prompt_templates
  (concept_id, concept_name, category, subcategory, display_name, description,
   duration_sec, platform_target, stages, variables, caption_template,
   hashtags_pool, display_order)
values
  (3, 'trend-replication', 'mode', 'saas-template',
   '모드 A: 자체 템플릿 활용', 'ai-studio-saas templates로 빠르게 복제',
   15, array['tiktok','shorts','reels'],
   '[
     {"stage":"template-pick","tool":"self-platform","instruction":"자체 templates 중 매칭 슬러그 픽 (dance-challenge, pose-transition, rotate-360, reaction-challenge)"},
     {"stage":"image-upload","instruction":"본인 셀카 또는 AI 모델 캐릭터 이미지 업로드"},
     {"stage":"prompt-customize","prompt":"원본 [TREND_KEY_ACTION] 그대로, 표정은 [TREND_VIBE], 마지막에 윙크 추가"},
     {"stage":"generate","credit_cost":10,"duration":5}
   ]'::jsonb,
   '{"TREND_NAME":"트렌드 이름","TREND_KEY_ACTION":"키 동작 영어","TREND_VIBE":"분위기"}'::jsonb,
   'AI한테 [TREND_NAME] 시켜봤음 🤖',
   'shared/hashtag-library.json#concept_tags.concept_3_trend',
   1),

  (3, 'trend-replication', 'mode', 'self-plus-ai',
   '모드 B: 본인 동작 + AI 합성', '본인 촬영 + Kling 배경/의상 변형',
   20, array['tiktok','shorts','reels'],
   '[
     {"stage":"shoot-self","tool":"smartphone","instruction":"본인 동작 직접 촬영 (9:16, 5~10초, 단순 배경)"},
     {"stage":"extract-keyframes","tool":"capcut","instruction":"키 프레임 3장 추출"},
     {"stage":"img2img-transform","tool":"midjourney-v7-img2img","prompt":"Same person, same pose, but in [NEW_BACKGROUND] wearing [NEW_OUTFIT], [TREND_VIBE] aesthetic, photorealistic --ar 9:16 --v 7"},
     {"stage":"video-generation","tool":"kling-2.5-pro-i2v","prompt":"Same [TREND_KEY_ACTION] motion, in new environment, smooth natural motion, preserve face identity","duration":5}
   ]'::jsonb,
   '{"TREND_NAME":"트렌드","TREND_KEY_ACTION":"동작 영어","TREND_VIBE":"분위기","NEW_BACKGROUND":"새 배경","NEW_OUTFIT":"새 의상"}'::jsonb,
   '내 동작에 AI 입혔더니 🌀 [TREND_NAME]',
   'shared/hashtag-library.json#concept_tags.concept_3_trend',
   2),

  (3, 'trend-replication', 'mode', 'full-ai-meta',
   '모드 C: 풀 AI 메타 변환', '트렌드를 AI 미학으로 재해석 (와우 최강)',
   15, array['tiktok','shorts','reels'],
   '[
     {"stage":"concept-line","tool":"manual","template":"POV: [TREND_NAME] 챌린지를 [VARIANT_AESTHETIC]가 따라한다면"},
     {"stage":"video-1","tool":"luma-ray-2-t2v","prompt":"[VARIANT_AESTHETIC] character performing [TREND_KEY_ACTION], dynamic camera matching trend rhythm, 9:16, [TREND_VIBE] mood, cinematic","duration":5},
     {"stage":"video-2","tool":"luma-ray-2-t2v","prompt":"Same [VARIANT_AESTHETIC] character, second beat of trend, [DIFFERENT_ACTION], smooth continuation","duration":5}
   ]'::jsonb,
   '{"TREND_NAME":"트렌드","VARIANT_AESTHETIC":"사이버펑크 로봇 / Pixar / 빈티지 / 수중 / 애니 중 1개","TREND_KEY_ACTION":"키 동작","TREND_VIBE":"분위기"}'::jsonb,
   '[TREND_NAME]을 AI가 따라하면 이렇게 됨 🤯',
   'shared/hashtag-library.json#concept_tags.concept_3_trend',
   3)
on conflict (concept_id, subcategory, category) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  stages = excluded.stages,
  variables = excluded.variables,
  caption_template = excluded.caption_template,
  display_order = excluded.display_order,
  updated_at = now();

-- Concept 4: ai-news ────────────────────────────────────────────
insert into public.prompt_templates
  (concept_id, concept_name, category, subcategory, display_name, description,
   duration_sec, platform_target, stages, variables, caption_template,
   hashtags_pool, display_order)
values
  (4, 'ai-news', 'category', 'model-launch',
   '모델 출시 (GPT/Claude/Gemini 등)', 'AI 칩 B-roll + 벤치마크 그래프',
   60, array['tiktok','shorts','reels'],
   '[
     {"stage":"script","tool":"chatgpt","prompt":"다음 AI 뉴스를 60초 한국어 숏폼 스크립트로: [NEWS_URL]. 150 단어, 훅 5초 + 본문 3포인트 + CTA"},
     {"stage":"avatar","tool":"heygen","instruction":"Photo Avatar + 한국어 보이스로 얼굴 영상 생성"},
     {"stage":"broll-1","tool":"luma-ray-2-t2v","prompt":"Macro close-up of glowing AI processor chip on dark surface, blue orange light pulses radiating from circuit pathways, slow rotation, cinematic film grain, vertical 9:16","duration":5},
     {"stage":"broll-2","tool":"luma-ray-2-t2v","prompt":"3D animated bar chart growing upward dramatically, glassmorphism blue glowing bars, smooth camera dolly, vertical 9:16","duration":5},
     {"stage":"broll-3","tool":"luma-ray-2-t2v","prompt":"Korean person typing on sleek laptop, screen showing AI chat with Korean text streaming, soft warm desk lamp, top-down, 9:16","duration":5},
     {"stage":"broll-4","tool":"luma-ray-2-t2v","prompt":"Floating 3D logo of [COMPANY] dissolving into particles, dark cinematic background, lens flare, 9:16","duration":5}
   ]'::jsonb,
   '{"NEWS_TITLE":"한글 제목 25자","NEWS_URL":"공식 소스","COMPANY":"OpenAI/Anthropic/Google","MODEL_NAME":"GPT-5/Claude 4.7","KEY_NUMBERS":"벤치마크/가격","KOREA_IMPACT":"한국 영향","MARKET_IMPACT":"시장 영향"}'::jsonb,
   '[NEWS_TITLE] 정리 60초 ⚡',
   'shared/hashtag-library.json#concept_tags.concept_4_ai_news',
   1),

  (4, 'ai-news', 'category', 'pricing-update',
   '가격/요금제 변경', '동전/그래프 B-roll',
   60, array['tiktok','shorts','reels'],
   '[
     {"stage":"script","tool":"chatgpt"},
     {"stage":"avatar","tool":"heygen"},
     {"stage":"broll-1","tool":"luma-ray-2-t2v","prompt":"3D bar chart growing upward with floating dollar signs, glassmorphism, camera dolly, 9:16","duration":5},
     {"stage":"broll-2","tool":"luma-ray-2-t2v","prompt":"Coins falling in slow motion onto glowing AI chip, blue rim light, macro lens, 9:16","duration":5}
   ]'::jsonb,
   '{"NEWS_TITLE":"제목","COMPANY":"회사","KEY_NUMBERS":"가격 변경"}'::jsonb,
   '[NEWS_TITLE] 정리 60초 💰',
   'shared/hashtag-library.json#concept_tags.concept_4_ai_news',
   2),

  (4, 'ai-news', 'category', 'company-news',
   '기업 인수/투자/조직 변화', '빌딩 + 로고 B-roll',
   60, array['tiktok','shorts','reels'],
   '[
     {"stage":"script","tool":"chatgpt"},
     {"stage":"avatar","tool":"heygen"},
     {"stage":"broll-1","tool":"luma-ray-2-t2v","prompt":"Modern glass tech building at golden hour, drone shot pulling back, lens flare, 9:16","duration":5},
     {"stage":"broll-2","tool":"luma-ray-2-t2v","prompt":"Two giant 3D logos colliding and merging into one, particles and energy waves, cinematic, 9:16","duration":5}
   ]'::jsonb,
   '{"NEWS_TITLE":"제목","COMPANY":"회사"}'::jsonb,
   '[NEWS_TITLE] 정리 60초 🏢',
   'shared/hashtag-library.json#concept_tags.concept_4_ai_news',
   3),

  (4, 'ai-news', 'category', 'user-tool-impact',
   '사용자 영향 (도구/기능)', '스마트폰/노트북 B-roll',
   60, array['tiktok','shorts','reels'],
   '[
     {"stage":"script","tool":"chatgpt"},
     {"stage":"avatar","tool":"heygen"},
     {"stage":"broll-1","tool":"luma-ray-2-t2v","prompt":"Hands using smartphone with AI chat app, taps generate animated response bubbles, soft warm lighting, top-down, 9:16","duration":5},
     {"stage":"broll-2","tool":"luma-ray-2-t2v","prompt":"Multiple holographic app icons floating around central glowing AI orb, sci-fi, particles, 9:16","duration":5}
   ]'::jsonb,
   '{"NEWS_TITLE":"제목"}'::jsonb,
   '[NEWS_TITLE] 정리 60초 📱',
   'shared/hashtag-library.json#concept_tags.concept_4_ai_news',
   4)
on conflict (concept_id, subcategory, category) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  stages = excluded.stages,
  variables = excluded.variables,
  caption_template = excluded.caption_template,
  display_order = excluded.display_order,
  updated_at = now();
