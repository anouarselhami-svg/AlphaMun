import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const [action, site] = process.argv.slice(2);
if (!['dev','build'].includes(action) || !['registration','main'].includes(site)) throw Error('Usage: node pages.mjs dev|build registration|main');
const project = fileURLToPath(new URL('../frontend/', import.meta.url));
const cli = fileURLToPath(new URL('./node_modules/wrangler/bin/wrangler.js', import.meta.url));
const args = action === 'dev'
  ? ['pages','dev',site === 'registration' ? 'registration-site/dist' : 'dist','--ip','127.0.0.1','--port',site === 'registration' ? '8787' : '8788']
  : ['pages','functions','build','--outdir',fileURLToPath(new URL(`./dist/${site}/`, import.meta.url))];
const child = spawn(process.execPath, [cli, ...args], {cwd:project, stdio:'inherit', windowsHide:true});
child.on('exit', code => {process.exitCode = code ?? 1;});
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
