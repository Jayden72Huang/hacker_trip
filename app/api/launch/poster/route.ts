import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { projectName, tagline, description } = await request.json();

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

    const prompt = `Generate a professional pitch deck cover poster image.
Theme: Modern, dark gradient background transitioning from deep purple (#2d1b69) to dark blue (#0a1628) to near-black (#05060a).
Visual elements:
- Abstract geometric shapes, flowing gradients, and subtle glow effects
- Futuristic tech aesthetic with particle effects or network nodes
- Clean, minimalist composition with generous whitespace
- Subtle accent colors: electric purple (#7c5dff), cyan (#4de1ff), pink-purple (#c759ff)
- Professional and modern feel, suitable for a tech startup pitch deck

The image should visually represent this concept: ${description || projectName}

IMPORTANT: Do NOT render any text, letters, words, or characters in the image. The image should be purely visual/abstract.
Style: Dark, cinematic, tech-forward, premium quality.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
              ],
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
