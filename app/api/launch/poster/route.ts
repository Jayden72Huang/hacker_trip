import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/llm';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

interface ProductInfo {
  name: string;
  tagline: string;
  features: string[];
  metrics: { value: string; label: string }[];
  audience: string;
}

async function extractProductInfo(
  projectName: string,
  description: string,
  tagline: string,
  targetAudience: string
): Promise<ProductInfo> {
  const result = await chatCompletion({
    messages: [
      {
        role: 'system',
        content: `You are a product marketing expert. Extract key product information and return JSON.
Rules:
- ALL text must be in ENGLISH (AI image models render English much better than Chinese)
- features: exactly 4 short feature names in English (2-3 words each, e.g. "Smart Analysis", "Real-time Sync", "Auto Deploy")
- metrics: exactly 4 impressive stats with short English labels (value like "10x", "99.9%", "50K+"; label like "Efficiency", "Accuracy", "Speed")
- tagline: one punchy English tagline, under 8 words
- audience: target audience in English, under 5 words (e.g. "Developers & Startups")
- If info is sparse, infer reasonable features/metrics based on the product type
Return ONLY valid JSON, no markdown.`,
      },
      {
        role: 'user',
        content: `Product: ${projectName}
Description: ${description || 'No description provided'}
Tagline: ${tagline || 'None'}
Target Audience: ${targetAudience || 'General developers'}

Return JSON: { "name": "...", "tagline": "...", "features": ["...", "...", "...", "..."], "metrics": [{"value": "...", "label": "..."}, ...], "audience": "..." }`,
      },
    ],
    maxTokens: 1024,
  });

  try {
    const cleaned = result.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      name: projectName,
      tagline: tagline || `${projectName} - AI Powered`,
      features: ['Smart Analysis', 'Auto Deploy', 'Team Collab', 'Data Insights'],
      metrics: [
        { value: '10x', label: 'Efficiency' },
        { value: '99.9%', label: 'Uptime' },
        { value: '<1s', label: 'Speed' },
        { value: '1000+', label: 'Users' },
      ],
      audience: targetAudience || 'Developers & Startups',
    };
  }
}

function buildPosterPrompt(info: ProductInfo): string {
  const [f1, f2, f3, f4] = info.features;
  const [m1, m2, m3, m4] = info.metrics;

  return `Generate a professional tech product infographic poster image. Vertical layout, aspect ratio 3:4 (1080x1440 pixels).

BACKGROUND: Deep dark gradient from #0a1628 (top) to #05060a (bottom). Subtle circuit-board line patterns and faint grid lines across the background. Scattered small glowing particles in purple and cyan.

LAYOUT (top to bottom):

1. TOP SECTION - Product Header:
   - Render the text "${info.name}" in very large, bold, futuristic sans-serif font, white color with a subtle purple (#7c5dff) outer glow, centered at the top.
   - Below it, render "${info.tagline}" in medium-sized thin font, light gray color, centered.

2. MIDDLE SECTION - Feature Grid:
   - Four glassmorphism cards arranged in a 2x2 grid with slight spacing.
   - Each card: semi-transparent dark background (rgba(255,255,255,0.06)) with thin white/purple border glow, rounded corners.
   - Card 1 (top-left): a rocket icon in cyan (#4de1ff) glow + text "${f1}" in white bold font below.
   - Card 2 (top-right): a lightning bolt icon in purple (#7c5dff) glow + text "${f2}" in white bold font below.
   - Card 3 (bottom-left): a shield icon in pink (#c759ff) glow + text "${f3}" in white bold font below.
   - Card 4 (bottom-right): a chart-bar icon in cyan (#4de1ff) glow + text "${f4}" in white bold font below.

3. STATS BAR SECTION:
   - A horizontal bar spanning the width, with four stat blocks evenly distributed.
   - Each stat: large text "${m1.value}" in cyan, small text "${m1.label}" in gray below.
   - Stat 2: "${m2.value}" / "${m2.label}"
   - Stat 3: "${m3.value}" / "${m3.label}"
   - Stat 4: "${m4.value}" / "${m4.label}"
   - Separated by subtle vertical divider lines.

4. BOTTOM SECTION - Audience & CTA:
   - Text "Built for: ${info.audience}" in small gray font, centered.
   - A glowing call-to-action button shape with text "Try Now" in white, with purple-to-cyan gradient background.

STYLE: Cyberpunk tech aesthetic, glassmorphism, neon glow accents (purple #7c5dff, cyan #4de1ff, pink #c759ff), premium dark UI design, clean and modern. The overall feel should be like a polished SaaS product landing page captured as a poster.

IMPORTANT: Render ALL specified text accurately. The text must be readable and correctly spelled. Use clean sans-serif fonts throughout.`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`launch-poster:${session.user.id}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试', retryAfter: rateLimit.retryAfter },
        { status: 429 }
      );
    }

    const { projectName, tagline, description, targetAudience } = await request.json();

    if (!projectName) {
      return NextResponse.json(
        { error: 'projectName is required' },
        { status: 400 }
      );
    }

    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Step 1: Extract structured product info via LLM
    const productInfo = await extractProductInfo(
      projectName,
      description,
      tagline,
      targetAudience || ''
    );

    // Step 2: Build detailed poster prompt
    const prompt = buildPosterPrompt(productInfo);

    // Step 3: Generate image via Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['image', 'text'],
            responseMimeType: 'text/plain',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate poster', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    const candidates = data.candidates || [];
    if (candidates.length > 0) {
      const parts = candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          return NextResponse.json({
            imageData: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          });
        }
      }
    }

    return NextResponse.json(
      { error: 'No image generated' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Poster generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
