/**
 * 生成功能模块配图的脚本
 * 使用 Google Gemini API 生成图片
 * 运行: npx ts-node scripts/generate-feature-images.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const imagePrompts = [
  {
    id: 'discover',
    prompt: 'A beautiful 3D illustration of a compass surrounded by floating colorful event cards and location pins, soft pastel purple and violet gradient background, clean minimal style, no text, suitable for tech product landing page',
    filename: 'discover.png'
  },
  {
    id: 'personalized',
    prompt: 'A warm 3D illustration of a friendly AI assistant character holding a gift box with hearts and stars floating around, soft pastel pink and rose gradient background, macaron-like color palette, no text, cozy and inviting style',
    filename: 'personalized.png'
  },
  {
    id: 'practical',
    prompt: 'A 3D illustration of practical tools including a calendar, travel suitcase, trophy, and airplane arranged neatly, soft pastel yellow and amber gradient background, clean minimal style, no text, productivity and travel theme',
    filename: 'practical.png'
  }
];

async function generateImage(prompt: string): Promise<string | null> {
  try {
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
                  text: prompt
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
      console.error('API error:', await response.text());
      return null;
    }

    const data = await response.json();
    const candidates = data.candidates || [];

    if (candidates.length > 0) {
      const parts = candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

async function main() {
  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY not set');
    process.exit(1);
  }

  const outputDir = path.join(__dirname, '../public/images/features');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const item of imagePrompts) {
    console.log(`Generating image for: ${item.id}...`);

    const imageData = await generateImage(item.prompt);

    if (imageData) {
      const buffer = Buffer.from(imageData, 'base64');
      const filepath = path.join(outputDir, item.filename);
      fs.writeFileSync(filepath, buffer);
      console.log(`✓ Saved: ${filepath}`);
    } else {
      console.log(`✗ Failed to generate: ${item.id}`);
    }

    // 等待一下避免 rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\nDone!');
}

main();
