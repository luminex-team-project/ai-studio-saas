-- Seed data for Premium AI Studio
-- Templates from the Figma Make /templates gallery + AI models from /create/product.

-- ───────── Templates ─────────
insert into public.templates
  (slug, name, category, popular, trending, likes_count, uses_count, display_order)
values
  ('dance-challenge',    '댄스 챌린지',    '댄스',    true,  true,  15234, 45678, 1),
  ('fashion-walk',       '패션 워크',      '패션',    true,  true,  12456, 34567, 2),
  ('product-unboxing',   '제품 언박싱',    '제품',    false, false,  9876, 23456, 3),
  ('pose-transition',    '포즈 트랜지션',  '트렌드',  false, true,  18765, 56789, 4),
  ('slow-motion-walk',   '슬로모션 워크',  '패션',    false, false,  7654, 19876, 5),
  ('rotate-360',         '360도 회전',     '트렌드',  true,  true,  14321, 38765, 6),
  ('reaction-challenge', '리액션 챌린지',  '챌린지',  false, false, 11234, 29876, 7),
  ('daily-vlog',         '일상 브이로그',  '일상',    false, false,  8765, 21345, 8)
on conflict (slug) do nothing;

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
