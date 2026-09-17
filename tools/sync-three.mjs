import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Keep production independent of npm, import maps and third-party CDNs.
const source = new URL('../node_modules/three/', import.meta.url);
const destination = new URL('../vendor/three/', import.meta.url);
const metadata = JSON.parse(await readFile(new URL('package.json', source), 'utf8'));
await mkdir(destination, { recursive: true });
// r186 ships unminified modules. Bundle the used exports, preserving the license.
await build({
    stdin: {
        contents: `export { Scene, PerspectiveCamera, WebGLRenderer, PlaneGeometry,
            Mesh, MeshBasicMaterial, Group, Texture, Raycaster, Vector2,
            SRGBColorSpace, DoubleSide, NoToneMapping } from 'three';`,
        resolveDir: fileURLToPath(new URL('../', import.meta.url))
    },
    outfile: fileURLToPath(new URL('three.module.js', destination)),
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2020',
    legalComments: 'external'
});
await copyFile(new URL('LICENSE', source), new URL('LICENSE', destination));
await writeFile(new URL('version.json', destination), `${JSON.stringify({
    package: 'three',
    version: metadata.version,
    source: 'https://github.com/mrdoob/three.js',
    license: 'MIT'
}, null, 2)}\n`);
console.log(`Vendored Three.js ${metadata.version} (minified ES module + MIT license).`);
