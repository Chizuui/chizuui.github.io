import { readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const original = execFileSync('git', ['show', 'HEAD:index.html'], { cwd: fileURLToPath(root), encoding: 'utf8' });
const sources = text => [...text.matchAll(/\bsrc="(Assets\/(?:Poster|Other)\/[^\"]+)"/g)].map(match => match[1]);
assert.deepEqual(sources(html), sources(original), 'Archive artwork order changed');
const originalLinks = text => [...text.matchAll(/href="((?:https:\/\/|mailto:)[^\"]+)"/g)].map(match => match[1]);
const links = new Set(originalLinks(html));
for (const href of originalLinks(original).filter(value => !value.includes('fonts.gstatic.com'))) assert(links.has(href), `Missing original link: ${href}`);
const references = new Set([...html.matchAll(/(?:src|href|data-preview)="([^\"]+)"/g)]
    .map(match => match[1].split('?')[0])
    .filter(value => !value.startsWith('#') && !/^[a-z]+:/i.test(value)));
for (const path of references) {
    const info = await stat(new URL(path, root));
    assert(info.isFile() && info.size > 0, `Missing/empty asset: ${path}`);
}
for (const module of ['gallery.js', 'gallery-scene.js']) {
    const source = await readFile(new URL(module, root), 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\()'([^']+)'/g)) {
        const path = match[1].split('?')[0];
        const info = await stat(new URL(path, root));
        assert(info.isFile(), `Missing module: ${path}`);
    }
}
const images = sources(html);
console.log(JSON.stringify({
    archiveImages: images.length,
    posters: images.filter(src => src.startsWith('Assets/Poster/')).length,
    other: images.filter(src => src.startsWith('Assets/Other/')).length,
    localHtmlReferences: references.size,
    preservedOriginalLinks: new Set(originalLinks(original)).size,
    result: 'All local assets exist; original artwork order and links are preserved.'
}, null, 2));
