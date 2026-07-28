import { createWriteStream, existsSync, mkdirSync, chmodSync } from 'fs';
import { get } from 'https';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { platform, arch } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const binariesDir = join(projectRoot, 'src-tauri', 'binaries');

if (!existsSync(binariesDir)) {
  mkdirSync(binariesDir, { recursive: true });
}

function getTarget() {
  const p = platform();
  const a = arch();
  if (p === 'darwin') {
    return a === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
  }
  if (p === 'win32') {
    return 'x86_64-pc-windows-msvc';
  }
  if (p === 'linux') {
    return a === 'arm64' ? 'aarch64-unknown-linux-gnu' : 'x86_64-unknown-linux-gnu';
  }
  throw new Error(`Unsupported platform: ${p} ${a}`);
}

function getDownloadInfo(target) {
  if (target.includes('apple-darwin')) {
    return {
      url: 'https://evermeet.cx/ffmpeg/get/ffmpeg.zip',
      binaryName: 'ffmpeg',
      archiveType: 'zip',
    };
  }
  if (target.includes('windows')) {
    return {
      url: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
      binaryName: 'ffmpeg.exe',
      archiveType: 'zip',
    };
  }
  if (target.includes('linux')) {
    const suffix = target.startsWith('aarch64') ? 'arm64' : 'amd64';
    return {
      url: `https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-${suffix}-static.tar.xz`,
      binaryName: 'ffmpeg',
      archiveType: 'tar.xz',
    };
  }
  throw new Error(`Unsupported target: ${target}`);
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      reject(err);
    });
  });
}

function findFileRecursive(dir, filename) {
  const { readdirSync, statSync } = requireCompat('fs');
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        const found = findFileRecursive(fullPath, filename);
        if (found) return found;
      } else if (entry === filename) {
        return fullPath;
      }
    }
  } catch (_) { }
  return null;
}

function requireCompat(mod) {
  // eslint-disable-next-line no-eval
  return eval(`require('${mod}')`);
}

async function main() {
  const target = getTarget();
  const ext = platform() === 'win32' ? '.exe' : '';
  const finalName = `ffmpeg-${target}${ext}`;
  const finalPath = join(binariesDir, finalName);

  if (existsSync(finalPath)) {
    console.log(`FFmpeg already exists at ${finalPath}`);
    return;
  }

  console.log(`Downloading FFmpeg for ${target}...`);
  const info = getDownloadInfo(target);

  const tmpDir = join(binariesDir, '.download_tmp');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const archivePath = join(tmpDir, `ffmpeg_archive.${info.archiveType === 'zip' ? 'zip' : 'tar.xz'}`);
  await downloadFile(info.url, archivePath);
  console.log('Downloaded. Extracting...');

  if (info.archiveType === 'zip') {
    // Try unzip first, then PowerShell on Windows
    const result = spawnSync('unzip', ['-o', archivePath, '-d', tmpDir], { stdio: 'pipe' });
    if (result.status !== 0 && platform() === 'win32') {
      spawnSync('powershell', [
        '-Command',
        `Expand-Archive -Path '${archivePath}' -DestinationPath '${tmpDir}' -Force`,
      ], { stdio: 'inherit' });
    }
  } else {
    spawnSync('tar', ['-xf', archivePath, '-C', tmpDir], { stdio: 'inherit' });
  }

  // Find the binary
  const found = findFileRecursive(tmpDir, info.binaryName);
  if (found) {
    spawnSync('cp', [found, finalPath], { stdio: 'inherit' });
    if (platform() !== 'win32') {
      chmodSync(finalPath, 0o755);
    }
    console.log(`FFmpeg bundled at ${finalPath}`);
  } else {
    // Try a broader search
    const foundAny = findFileRecursive(tmpDir, 'ffmpeg');
    if (foundAny) {
      spawnSync('cp', [foundAny, finalPath], { stdio: 'inherit' });
      if (platform() !== 'win32') {
        chmodSync(finalPath, 0o755);
      }
      console.log(`FFmpeg bundled at ${finalPath}`);
    } else {
      console.error('Could not find ffmpeg binary in extracted archive.');
      process.exit(1);
    }
  }

  // Cleanup
  spawnSync('rm', ['-rf', tmpDir], { stdio: 'pipe' });
}

main().catch((err) => {
  console.error('Failed to download FFmpeg:', err.message);
  process.exit(1);
});
