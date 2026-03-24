import { promises as fs } from 'node:fs';
import path from 'node:path';

const API_URL = 'https://api.freepik.com/v1/ai/beta/remove-background';
const PROJECT_ROOT = process.cwd();
const PRESENTS_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'img', 'presents');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

const apiKey = process.env.FREEPIK_API_KEY;
const presentsBaseUrl = process.env.PRESENTS_BASE_URL || 'https://cordiant.autogoda.ru/assets/img/presents';

if (!apiKey) {
  console.error('FREEPIK_API_KEY is required.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isImage = (fileName) => /\.(png|jpe?g)$/i.test(fileName);

const toPublicUrl = (fileName) => {
  const encoded = encodeURIComponent(fileName).replace(/%2F/g, '/');
  return `${presentsBaseUrl.replace(/\/$/, '')}/${encoded}`;
};

const replaceInPublicFiles = async (replacements) => {
  if (!replacements.length) {
    return;
  }

  const stack = [PUBLIC_DIR];
  const filePaths = [];

  while (stack.length) {
    const dir = stack.pop();
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (/\.(html|css|js|json|md)$/i.test(entry.name)) {
        filePaths.push(fullPath);
      }
    }
  }

  for (const filePath of filePaths) {
    const original = await fs.readFile(filePath, 'utf8');
    let updated = original;

    for (const { from, to } of replacements) {
      updated = updated.split(from).join(to);
    }

    if (updated !== original) {
      await fs.writeFile(filePath, updated, 'utf8');
      console.log(`Updated references in: ${path.relative(PROJECT_ROOT, filePath)}`);
    }
  }
};

const run = async () => {
  const entries = await fs.readdir(PRESENTS_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && isImage(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'ru'));

  if (!files.length) {
    console.log('No presents images found.');
    return;
  }

  const replacements = [];

  for (const fileName of files) {
    const imageUrl = toPublicUrl(fileName);
    const baseName = fileName.replace(/\.[^.]+$/, '');
    const outputName = `${baseName}.png`;

    console.log(`Processing: ${fileName}`);

    const body = new URLSearchParams({ image_url: imageUrl });
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-freepik-api-key': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Freepik error for ${fileName}: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    const downloadUrl = payload.url || payload.high_resolution;

    if (!downloadUrl) {
      throw new Error(`No download URL returned for ${fileName}`);
    }

    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      throw new Error(`Download error for ${fileName}: ${downloadResponse.status} ${errorText}`);
    }

    const arrayBuffer = await downloadResponse.arrayBuffer();
    const outputPath = path.join(PRESENTS_DIR, outputName);
    await fs.writeFile(outputPath, Buffer.from(arrayBuffer));

    console.log(`Saved: ${path.relative(PROJECT_ROOT, outputPath)}`);

    if (fileName !== outputName) {
      replacements.push({
        from: `assets/img/presents/${fileName}`,
        to: `assets/img/presents/${outputName}`,
      });
    }

    // Prevent bursty calls and make failures easier to debug.
    await sleep(250);
  }

  await replaceInPublicFiles(replacements);

  console.log('Done.');
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
