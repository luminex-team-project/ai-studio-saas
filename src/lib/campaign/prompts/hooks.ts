import { CORE_CLIP_PROMPTS } from './clips'

// 3 hook variants for the A/B/C test. All run on Runway gen4_turbo with mask_0.
// hook_a mirrors clip_1 exactly so the "default" reel and the Mystery variant
// share a single generation job (BullMQ jobId dedupes).

export type HookId = 'hook_a' | 'hook_b' | 'hook_c'

export type HookPrompt = {
  id: HookId
  name: 'Mystery' | 'Shock' | 'Lifestyle'
  prompt: string
  negativePrompt: string
}

export const HOOK_PROMPTS: Record<HookId, HookPrompt> = {
  hook_a: {
    id: 'hook_a',
    name: 'Mystery',
    prompt: CORE_CLIP_PROMPTS.clip_1.prompt,
    negativePrompt: CORE_CLIP_PROMPTS.clip_1.negativePrompt,
  },

  hook_b: {
    id: 'hook_b',
    name: 'Shock',
    prompt:
      "EXTREME CLOSE-UP of a fingertip gently pressing near a tiny red blemish on an otherwise flawless Korean woman's cheek. Her finger lingers for half a second with concerned expression. Then camera rapidly pulls back in a quick whip-pan zoom-out to reveal she is holding up the EloM Trouble Patch mask package with a mischievous, confident smile — expression reads 'not anymore'. Hydrangea garden background, golden hour. Hyperreal skin detail, poreless natural glow, 4K, cinematic 85mm lens shallow depth of field. Motion: finger pressing cheek 0-0.8s, whip-zoom-out 0.8-1.2s, confident smile 1.2-2.0s, package raise. Mood: relatable problem to confident solution in 2 seconds.",
    negativePrompt:
      'exaggerated acne, distorted face, disease-like appearance, uncanny valley, morphing features, harsh makeup, fake blemish, CGI skin',
  },

  hook_c: {
    id: 'hook_c',
    name: 'Lifestyle',
    prompt:
      "POV SHOT looking down at a Korean woman's hands resting in her lap holding the EloM Trouble Patch mask package, seated in a sunlit cafe by a window. Warm morning sunlight streams across her hands and the package, casting soft shadows on her beige linen outfit. A coffee cup sits blurred in the foreground, wisps of steam rising. Her other hand slowly picks up the package and raises it toward camera with gentle deliberation. 35mm lens, shallow depth of field, authentic vlog aesthetic with slight organic handheld micro-movement. Mood: aspirational morning routine, viewer is in her shoes. Style: Aesop boutique meets Kinfolk magazine.",
    negativePrompt:
      'multiple people, face reveal, unstable camera, motion blur, cluttered background, harsh fluorescent lighting, commercial staging, fake hands',
  },
}
