import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 深色主题风格的配图 prompts
const prompts = [
  {
    id: 'discover',
    prompt: `A stunning 3D illustration on dark background featuring a glowing purple compass floating in space, surrounded by holographic event cards with neon edges, floating location pins with soft glow, abstract geometric shapes, dark navy and deep purple gradient background, cyberpunk style, soft neon lighting, futuristic tech aesthetic, no text, high quality render`,
  },
  {
    id: 'personalized',
    prompt: `A beautiful 3D illustration on dark background showing a friendly glowing AI robot assistant character with soft pink and rose neon accents, surrounded by floating personalized recommendation cards with heart icons, holographic profile elements, dark background with pink and magenta gradient glow, futuristic but warm aesthetic, soft lighting, no text, high quality render`,
  },
  {
    id: 'practical',
    prompt: `A sleek 3D illustration on dark background featuring organized floating tools: a glowing calendar, travel suitcase with neon trim, golden trophy, paper airplane, connected by soft light trails, dark background with amber and orange gradient glow, clean futuristic style, productivity theme, soft neon lighting, no text, high quality render`,
  }
];

async function generateImage(prompt) {
  const response = await fetch('http://localhost:3000/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, style: '3D illustration' })
  });

  const data = await response.json();
  if (data.success && data.image) {
    return Buffer.from(data.image.data, 'base64');
  }
  throw new Error(data.error || 'Failed to generate');
}

async function main() {
  const outputDir = path.join(__dirname, '../public/images/features');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const item of prompts) {
    console.log(`Generating: ${item.id}...`);
    try {
      const buffer = await generateImage(item.prompt);
      const filepath = path.join(outputDir, `${item.id}.png`);
      fs.writeFileSync(filepath, buffer);
      console.log(`✓ Saved: ${filepath}`);
    } catch (err) {
      console.error(`✗ Failed ${item.id}:`, err.message);
    }
    // Wait to avoid rate limiting
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('Done!');
}

main();
