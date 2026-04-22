-- Seed data for Premium AI Studio
-- Templates from the Figma Make /templates gallery + AI models from /create/product.

-- ───────── Templates ─────────
-- New UX: clicking a card takes the user to /create/selfie?template=<slug>
-- with `example_prompt` pre-filled in a textarea. The prompt describes which
-- subject(s) the user is replacing with their photo, and any extra scene
-- direction they want.

insert into public.templates
  (slug, name, category, popular, trending, likes_count, uses_count, display_order,
   replace_target_hint, example_prompt)
values
  ('cute-dog-greeting',  '애교 부리는 강아지', '일상',   true,  true,  21453, 62134, 0,
   '달려와 애교 부리는 강아지 1마리 + 맞이하는 인물 1명',
   '강아지와 인물을 내가 첨부한 사진으로 대체해줘. 강아지가 달려와서 애교를 부린 뒤, 내가 "앉아!"라고 하면 강아지가 차분히 앉는 모습까지 한 컷으로 이어서 연출해줘.'),

  ('dance-challenge',    '댄스 챌린지',    '댄스',    true,  true,  15234, 45678, 1,
   '카메라 앞에서 춤추는 인물 1명',
   '영상 속 인물을 내가 첨부한 사진 속 사람으로 대체해줘. 원본 안무와 카메라 움직임은 그대로 유지하고, 표정은 자신감 있게 웃는 느낌으로.'),

  ('fashion-walk',       '패션 워크',      '패션',    true,  true,  12456, 34567, 2,
   '런웨이를 걷는 모델 1명',
   '런웨이를 걷는 모델을 내가 첨부한 사진으로 대체해줘. 스튜디오 조명과 의상 실루엣은 유지하고, 마지막에 카메라를 향해 돌아보며 한 번 웃어주는 컷을 추가해줘.'),

  ('product-unboxing',   '제품 언박싱',    '제품',    false, false,  9876, 23456, 3,
   '언박싱하는 인물 1명 + 제품 1개',
   '언박싱하는 인물을 내가 첨부한 사진으로 대체하고, 제품은 첨부한 제품 사진으로 바꿔줘. 박스를 여는 순간의 기대감 있는 표정과, 제품을 들어 보여주는 클로즈업 컷을 자연스럽게 이어줘.'),

  ('pose-transition',    '포즈 트랜지션',  '트렌드',  false, true,  18765, 56789, 4,
   '여러 포즈를 이어가는 인물 1명',
   '영상 속 인물을 내가 첨부한 사진으로 대체해줘. 3가지 포즈(정면 - 측면 - 뒷모습)가 부드러운 트랜지션으로 이어지도록 해줘.'),

  ('slow-motion-walk',   '슬로모션 워크',  '패션',    false, false,  7654, 19876, 5,
   '슬로모션으로 걷는 인물 1명',
   '걷는 인물을 내가 첨부한 사진으로 대체해줘. 머리카락과 옷자락이 자연스럽게 흔들리는 슬로모션 느낌을 살리고, 배경은 원본 그대로 유지해줘.'),

  ('rotate-360',         '360도 회전',     '트렌드',  true,  true,  14321, 38765, 6,
   '카메라 주변을 도는 인물 1명',
   '카메라가 인물 주변을 360도 도는 샷이야. 인물을 내가 첨부한 사진으로 대체하고, 바닥의 그림자와 회전 속도는 그대로 유지해줘.'),

  ('reaction-challenge', '리액션 챌린지',  '챌린지',  false, false, 11234, 29876, 7,
   '놀라는 표정의 인물 1명',
   '영상 속 인물을 내가 첨부한 사진으로 대체해줘. 무언가에 놀란 리액션 표정이 과장되지 않게 자연스럽게 나오도록 해주고, 마지막 프레임에 웃음이 터지는 컷을 한 컷 추가해줘.'),

  ('daily-vlog',         '일상 브이로그',  '일상',    false, false,  8765, 21345, 8,
   '일상을 촬영하는 인물 1명',
   '브이로그 속 인물을 내가 첨부한 사진으로 대체해줘. 카페에서 커피를 마시며 카메라를 보고 웃는 장면으로 분위기를 유지해줘.')
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  popular = excluded.popular,
  trending = excluded.trending,
  likes_count = excluded.likes_count,
  uses_count = excluded.uses_count,
  display_order = excluded.display_order,
  replace_target_hint = excluded.replace_target_hint,
  example_prompt = excluded.example_prompt;

-- ───────── AI Models ─────────
insert into public.ai_models
  (slug, name, style, age_range, popular, display_order)
values
  ('jimin',    '지민', '캐주얼/친근',   '20대', true,  1),
  ('seoyeon',  '서연', '우아/고급',     '30대', true,  2),
  ('taeyoon',  '태윤', '프로페셔널',    '30대', false, 3),
  ('haeun',    '하은', '트렌디/발랄',   '20대', false, 4),
  ('minjun',   '민준', '스포티/역동',   '20대', true,  5),
  ('sua',      '수아', '엘레강스',      '30대', false, 6)
on conflict (slug) do nothing;
