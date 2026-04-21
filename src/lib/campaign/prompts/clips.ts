// 6 core clip prompts for the EloM Trouble Patch Mask viral reel campaign.
// Authoritative routing (provider + model) is encoded here and consumed by
// timeline.ts — do not reassign providers elsewhere.

export type CoreClipId = 'clip_1' | 'clip_2' | 'clip_3' | 'clip_4' | 'clip_5' | 'clip_6'

export type CoreClipPrompt = {
  id: CoreClipId
  useCase: string
  prompt: string
  negativePrompt: string
}

export const CORE_CLIP_PROMPTS: Record<CoreClipId, CoreClipPrompt> = {
  clip_1: {
    id: 'clip_1',
    useCase: 'Hook default — playful peek over package (fallback if no A/B/C test)',
    prompt:
      "EXTREME CLOSE-UP of a young Korean woman's radiant face partially hidden behind the EloM Trouble Patch mask package she holds up to her cheek. Her one visible eye glances directly at camera with a playful, knowing micro-expression, eyelashes fluttering slowly. Hydrangea petals blur softly in the background bokeh. Hyperreal skin detail with subsurface scattering, poreless natural glow, no makeup look. Cinematic 85mm lens, extreme shallow depth of field f/1.4, 4K, golden hour backlight creating gentle rim light on her hair. Subtle 1-second push-in camera motion with micro hand tremor for organic feel. Premium Korean beauty campaign aesthetic, vertical 9:16. Mood: mysterious, intimate, playful. Motion: very subtle — only eye movement, eyelash flutter, tiny package rise toward face.",
    negativePrompt:
      'distorted face, warped text, extra fingers, plastic skin, static dead eyes, harsh shadow, CGI look, uncanny valley, logo distortion, blurry product edge',
  },

  clip_2: {
    id: 'clip_2',
    useCase: 'Tension bridge — dolly-out reveals woman in hydrangea garden',
    prompt:
      "MEDIUM SHOT pulling back from the woman's face to reveal she is standing in a lush garden of blooming blue and pink hydrangeas at golden hour. She lowers the EloM mask package from her face with a slow, confident reveal, her natural smile spreading as the package descends to chest level. Wind moves her long black hair gently, individual strands catching backlight. Garden leaves rustle, petals drift across frame in slow motion 60fps feel. Camera performs a smooth dolly-out combined with slight upward tilt, 35mm lens, cinematic anamorphic flares from the sun behind her. Photorealistic, commercial beauty cinematography. Motion: dolly-out pullback, hair in wind, petals drifting, package lowering smoothly.",
    negativePrompt:
      'jump cut, distorted face, morphing features, warped package text, CGI plastic skin, jittery motion, lens glitches, background artifacts',
  },

  clip_3: {
    id: 'clip_3',
    useCase: 'Intrigue / product tilt — typography + logo sharp focus',
    prompt:
      "TIGHT CLOSE-UP of the woman's slender hands holding the EloM Trouble Patch mask package at chest level. Her perfectly manicured nails catch light. She slowly tilts the package forward toward camera, revealing the clean minimalist typography and EloM logo in sharp focus. Soft hydrangea bokeh swirls behind. A single petal floats past the package in the foreground. Macro lens detail on package texture — matte paper finish with subtle grain visible. Photorealistic skincare commercial, premium K-beauty aesthetic. Motion: gentle package tilt toward camera, single petal drift, micro finger adjustment. Focus: razor-sharp on package text and logo, cream-soft background.",
    negativePrompt:
      'warped EloM text, deformed logo, typography hallucination, blurry product, fake hands, extra fingers, shaky camera, over-saturated colors',
  },

  clip_4: {
    id: 'clip_4',
    useCase: 'Reveal hero (longest) — sheet mask unfolds with essence shimmer',
    prompt:
      'HERO PRODUCT SHOT: Two elegant feminine hands rise into frame from below, slowly and gracefully unfolding a pristine white EloM sheet mask upward against a clean minimalist pale gray studio backdrop. As the mask unfolds, soft white light filters through the delicate fabric, making it appear almost luminous and ethereal. Micro water droplets glisten on the mask surface like tiny diamonds, serum essence visualized. The fabric ripples in slow motion, revealing its silky cotton-blend texture with macro detail — individual fibers visible. A subtle mist drifts across the lower frame suggesting freshness and purity. Camera: static locked-off frame for product authority, then ultra-slow 5-percent zoom-in over the duration. 50mm lens f/2.8, studio three-point lighting with key from upper left, soft fill, rim light behind mask to create translucent glow. Mood: clinical purity meets sensory delight, ASMR-level tactile satisfaction.',
    negativePrompt:
      'distorted hands, extra fingers, tearing fabric, torn edges, watermark, harsh shadows, jittery motion, ghost hands, fake CGI mask, plastic look, dry fabric',
  },

  clip_5: {
    id: 'clip_5',
    useCase: 'Proof / package rotation — text fidelity critical (Kling master, cfg 0.8)',
    prompt:
      'HERO PACKAGE BEAUTY SHOT: The EloM Trouble Patch Mask package stands upright on a pure white seamless surface, slowly rotating 25 degrees clockwise to reveal its clean minimalist design from the front. The sheet mask beside the package gently sways as if floating in a slight breeze. All text on the package is razor-sharp and legible — TROUBLE PATCH MASK, SYNERGY CARE WITH EloM KEY INGREDIENTS OF TEA TREE BIOME AND CONTROL BIO 95, and the EloM logo all clearly visible. Subtle particle effects drift around the package — tiny abstract green dots suggesting tea tree extract molecules, elegant and scientific like a luxury skincare lab visualization. Soft diffused studio lighting from above creates a gentle gradient shadow on the white surface. Camera performs a slow smooth 15-degree orbital movement around the package while maintaining sharp focus on the product throughout. Style: Apple product reveal meets Hermes beauty campaign. Ultra-premium, clinical, aspirational.',
    negativePrompt:
      'distorted typography, warped EloM logo, blurry text, hallucinated letters, shaky motion, lens distortion, cartoonish particles, color shift on package, text morphing, perspective wobble',
  },

  clip_6: {
    id: 'clip_6',
    useCase: 'Mirror CTA — closes bookend with hook in hydrangea garden',
    prompt:
      'FINAL HERO MOMENT: The Korean woman from the opening shot now stands confidently in the hydrangea garden, holding the EloM package at chest level but slightly lower than before, her full radiant smile visible. She looks directly into camera with a warm, sincere expression — her skin is impossibly clear, glowing, luminous with a fresh post-skincare radiance. She slowly brings one hand up to gently touch her cheek in a natural, satisfied gesture, then smiles wider. Background: blooming hydrangeas in soft focus, golden hour light creating a halo effect around her hair. A few petals drift past in slow motion. Camera slowly pushes in toward her face for the final 1.5 seconds, her eyes remaining locked on the viewer. Style: closes the loop with the opening shot as a visual bookend. Premium Korean beauty commercial final frame aesthetic.',
    negativePrompt:
      'uncanny smile, forced expression, distorted face, fake skin texture, plastic look, morphing features, warped package, lifeless eyes, artificial grin',
  },
}
