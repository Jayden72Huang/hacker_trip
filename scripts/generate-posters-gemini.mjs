import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'showcase');

if (!GOOGLE_API_KEY) {
  console.error('ERROR: GOOGLE_API_KEY not found in .env.local');
  process.exit(1);
}

const posters = [
  {
    filename: 'hookflow-poster.png',
    name: 'HookFlow',
    tagline: 'AI E-commerce Video Generator',
    visual: 'A sleek dark UI mockup of a video editing dashboard. Show a split-screen: on the left, a product listing card (sneakers/gadget), on the right, a short-form video player with AI-generated captions and trending hooks. Include a timeline bar at bottom with waveform. The UI should look like a modern SaaS product screenshot with glassmorphism panels.',
    accent: 'electric purple (#7c5dff)',
  },
  {
    filename: 'snapaudit-poster.png',
    name: 'SnapAudit',
    tagline: 'Smart Contract Security Scanner',
    visual: 'A dark-themed security audit dashboard UI. Show a smart contract code snippet on the left with highlighted vulnerability lines in red/yellow. On the right, a security score gauge (showing green/safe), and a list of detected issues with severity badges (Critical, High, Medium). Include a shield icon with a checkmark. The feel should be cybersecurity meets blockchain.',
    accent: 'magenta pink (#c759ff)',
  },
  {
    filename: 'dataforge-poster.png',
    name: 'DataForge',
    tagline: 'No-Code On-Chain Analytics',
    visual: 'A dark-themed analytics dashboard with multiple chart panels: a line chart showing token price trending up, a bar chart of transaction volumes, a donut chart of asset distribution, and a real-time data feed ticker. Show drag-and-drop interface hints with dotted outlines. Include blockchain network node visualization in the background. The style should be data-rich but clean.',
    accent: 'cyan (#4de1ff)',
  },
  {
    filename: 'voicedao-poster.png',
    name: 'VoiceDAO',
    tagline: 'Voice-Powered DAO Governance',
    visual: 'A dark-themed governance voting interface. Show a central audio waveform visualization (like a voice being recorded) with a microphone icon. Around it, show a voting results panel with progress bars (For/Against/Abstain). Include connected avatar nodes representing DAO members in a network graph. Add a blockchain confirmation indicator. The feel should be decentralized, community-driven, Web3.',
    accent: 'purple to pink gradient (#7c5dff to #c759ff)',
  },
];

async function generatePoster(poster) {
  const prompt = `Create a pitch deck poster image for "${poster.name}" — ${poster.tagline}.

Visual description:
${poster.visual}

Design rules:
- DARK background (#05060a to #0a1628), accent color: ${poster.accent}
- This should look like an actual product UI screenshot or mockup, NOT abstract art
- Show realistic UI elements: buttons, cards, charts, panels with glassmorphism (semi-transparent panels with blur)
- Include subtle grid lines in background, soft glow effects on accent elements
- 3:4 portrait aspect ratio
- Premium, polished, modern SaaS product aesthetic
- The overall mood: dark, techy, professional — like a Y Combinator demo day slide

IMPORTANT: Do NOT include any readable text, words, letters or numbers. Use blurred placeholder text blocks or lorem-style shapes instead of actual words. The UI elements should be recognizable by shape and color, not by text.`;

  console.log(`Generating: ${poster.name}...`);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '3:4',
          personGeneration: 'dont_allow',
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error(`Failed for ${poster.name}:`, err);
    return false;
  }

  const data = await response.json();

  // Imagen 4.0 response format
  const predictions = data.predictions || [];
  if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
    const buffer = Buffer.from(predictions[0].bytesBase64Encoded, 'base64');
    const outputPath = path.join(OUTPUT_DIR, poster.filename);
    fs.writeFileSync(outputPath, buffer);
    console.log(`  Saved: ${poster.filename} (${(buffer.length / 1024).toFixed(0)}KB)`);
    return true;
  }

  // Fallback: try Gemini generateContent format
  const candidates = data.candidates || [];
  if (candidates.length > 0) {
    const parts = candidates[0].content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        const outputPath = path.join(OUTPUT_DIR, poster.filename);
        fs.writeFileSync(outputPath, buffer);
        console.log(`  Saved: ${poster.filename} (${(buffer.length / 1024).toFixed(0)}KB)`);
        return true;
      }
    }
  }

  console.error(`  No image generated for ${poster.name}`, JSON.stringify(data).slice(0, 300));
  return false;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let success = 0;
  for (const poster of posters) {
    const ok = await generatePoster(poster);
    if (ok) success++;
    // Brief pause between API calls
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\nDone: ${success}/${posters.length} posters generated in public/showcase/`);
}

main().catch(console.error);
