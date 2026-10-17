import Anthropic from '@anthropic-ai/sdk';
import { ANALYSIS_SCHEMA, SYSTEM_PROMPT } from './prompt';

export interface Env {
  ANTHROPIC_API_KEY: string;
  ACCESS_KEY: string;
  ALLOWED_ORIGINS: string;
  MODEL: string;
  EFFORT: string;
}

interface ChartImage {
  view: string;
  label: string;
  media_type: 'image/jpeg' | 'image/png' | 'image/webp';
  data: string;
}

interface AnalyzeRequest {
  images: ChartImage[];
  context?: {
    symbol?: string;
    localTime?: string;
    trigger?: string;
    note?: string;
  };
}

const MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGES = 3;
const MAX_IMAGE_B64 = 7_000_000; // ~5 MB decoded
const EFFORTS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);

function cors(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
  const ok = origin && allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0] ?? '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-access-key',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'content-type': 'application/json' } });
}

function sameSecret(a: string, b: string) {
  const enc = new TextEncoder();
  const x = enc.encode(a), y = enc.encode(b);
  if (x.byteLength !== y.byteLength) return false;
  return crypto.subtle.timingSafeEqual(x, y);
}

function validate(body: unknown): AnalyzeRequest | string {
  const b = body as AnalyzeRequest;
  if (!b || !Array.isArray(b.images) || b.images.length === 0) return 'Send at least one chart image.';
  if (b.images.length > MAX_IMAGES) return `Send at most ${MAX_IMAGES} images.`;
  for (const img of b.images) {
    if (!img || typeof img.data !== 'string' || typeof img.view !== 'string' || typeof img.label !== 'string') return 'Malformed image.';
    if (!MEDIA_TYPES.has(img.media_type)) return 'Images must be JPEG, PNG or WebP.';
    if (img.data.length > MAX_IMAGE_B64) return 'An image is too large.';
  }
  return b;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = cors(request.headers.get('Origin'), env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/') return json({ ok: true, service: 'futures-desk-ai' }, 200, headers);
    if (request.method !== 'POST' || url.pathname !== '/analyze') return json({ ok: false, error: 'Not found' }, 404, headers);

    if (!env.ANTHROPIC_API_KEY || !env.ACCESS_KEY) return json({ ok: false, error: 'Server is missing its secrets.' }, 500, headers);
    if (!sameSecret(request.headers.get('x-access-key') ?? '', env.ACCESS_KEY)) return json({ ok: false, error: 'Wrong access password.' }, 401, headers);

    let parsed: AnalyzeRequest | string;
    try {
      parsed = validate(await request.json());
    } catch {
      parsed = 'Body must be JSON.';
    }
    if (typeof parsed === 'string') return json({ ok: false, error: parsed }, 400, headers);

    const { images, context = {} } = parsed;
    const content: Anthropic.Beta.BetaContentBlockParam[] = [];
    for (const img of images) {
      content.push({ type: 'text', text: `Chart: ${img.label} (view ${img.view})` });
      content.push({ type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } });
    }
    content.push({
      type: 'text',
      text: [
        `Symbol: ${context.symbol || '@ES'}.`,
        context.localTime ? `Trader's local time at snapshot: ${context.localTime}.` : '',
        context.trigger ? `Check type: ${context.trigger}.` : '',
        context.note ? `Trader's note: ${context.note}` : '',
        'Apply the rules to these snapshots. Which setup fits best right now, and do the rules say buy, sell or wait?',
      ].filter(Boolean).join('\n'),
    });

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const model = env.MODEL || 'claude-opus-5-5';
    const effort = EFFORTS.has(env.EFFORT) ? (env.EFFORT as Anthropic.Beta.BetaOutputConfig['effort']) : 'high';

    try {
      const response = await client.beta.messages.create({
        model,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: SYSTEM_PROMPT,
        output_config: { effort, format: { type: 'json_schema', schema: ANALYSIS_SCHEMA } },
        messages: [{ role: 'user', content }],
      });

      const usage = {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      };
      if (response.stop_reason === 'refusal') return json({ ok: false, error: 'The model declined this request.', usage }, 502, headers);
      if (response.stop_reason === 'max_tokens') return json({ ok: false, error: 'The analysis was cut off. Try again.', usage }, 502, headers);

      const text = response.content.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('');
      let result: unknown;
      try {
        result = JSON.parse(text);
      } catch {
        return json({ ok: false, error: 'The analysis came back in an unexpected format.', usage }, 502, headers);
      }
      return json({ ok: true, model: response.model, usage, result }, 200, headers);
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) return json({ ok: false, error: 'The Anthropic API key is invalid.' }, 502, headers);
      if (err instanceof Anthropic.RateLimitError) return json({ ok: false, error: 'Rate limited by Anthropic. Try again in a minute.' }, 429, headers);
      if (err instanceof Anthropic.BadRequestError) return json({ ok: false, error: `Anthropic rejected the request: ${err.message}` }, 502, headers);
      if (err instanceof Anthropic.APIError) return json({ ok: false, error: `Anthropic API error ${err.status ?? ''}`.trim() }, 502, headers);
      return json({ ok: false, error: 'Could not reach Anthropic.' }, 502, headers);
    }
  },
} satisfies ExportedHandler<Env>;
