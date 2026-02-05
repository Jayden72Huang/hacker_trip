import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { prompt, style = 'illustration' } = await request.json();

    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // 使用 Gemini 2.0 Flash 的图片生成功能
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
                {
                  text: `Generate a beautiful ${style} image: ${prompt}.
                  Style: Modern, clean, soft gradients, pastel colors like macaron (soft pink, lavender, mint, peach).
                  Make it suitable for a tech product landing page.
                  No text in the image.`
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ['image', 'text'],
            responseMimeType: 'text/plain'
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate image', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 提取生成的图片
    const candidates = data.candidates || [];
    if (candidates.length > 0) {
      const parts = candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          return NextResponse.json({
            success: true,
            image: {
              mimeType: part.inlineData.mimeType,
              data: part.inlineData.data
            }
          });
        }
      }
    }

    return NextResponse.json(
      { error: 'No image generated', data },
      { status: 400 }
    );
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
