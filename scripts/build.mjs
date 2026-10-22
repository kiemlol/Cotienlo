import {readFile,writeFile,copyFile,mkdir,cp,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const input=resolve('dist');
const original=await readFile(input+'/assets/index-ChkNmBLw.js','utf8');
let code=original;
for(const [from,to] of [['new Qf(Kp)','new window.CTLClient(Kp)'],['yu.get(','window.CTLCallbacks(']]){
 if(!code.includes(from))throw Error('Client anchor missing: '+from);
 code=code.replaceAll(from,to);
}
code+='\nwindow.CTL={store:H,data:L,send:W,room:cm,enter:mm,zone:He,physics:(p,z)=>new We(je(p.x,p.y),z,P5/1000)};\n';
await writeFile('dist/assets/game-client.js',code);
await mkdir('dist/runtime',{recursive:true});
await copyFile('src/runtime.mjs','dist/runtime/runtime.mjs');
await copyFile('src/profile-defaults.mjs','dist/runtime/profile-defaults.mjs');
await cp('src/systems','dist/runtime/systems',{recursive:true});
const version='20261022-v3';
async function versionModules(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+f.name;if(f.isDirectory())await versionModules(p);else if(f.name.endsWith('.mjs')){const s=await readFile(p,'utf8');await writeFile(p,s.replace(/(from\s+['"]\.[^'"]+\.mjs)(['"])/g,'$1?v='+version+'$2'));}}}
await versionModules('dist/runtime');
const data=JSON.parse(await readFile(input+'/data/game.json','utf8'));
if(data.bal?.giao_dien?.lien_he)data.bal.giao_dien.lien_he.zalo='';
await writeFile('dist/data/game.json',JSON.stringify(data));
let html=await readFile('src/index.original.html','utf8');
html=html.replace('/assets/index-ChkNmBLw.js','/assets/game-client.js?v='+version).replace('<title>','<title>Bản game độc lập · ');
html=html.replace(/<link rel="canonical"[^>]*>/,'').replace(/<meta property="og:url"[^>]*>/,'').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,'');
html=html.replace('<head>','<head>\n<script type="module" src="/runtime/runtime.mjs?v='+version+'"></script>');
for(const path of ['data/game.json','data/text_vi.json','assets/visual/index.json'])html=html.replace('href="'+path+'"','href="'+path+'?v=20261022"');
html=html.replace('</head>','<style>[data-nut="ung_ho"],[data-nut="tin_moi"],[data-nut="bang_tb"],[data-nut="xep_hang"],[data-nut="tim_to"],[data-nut="bang"],[data-nut="thu"],[data-nut="thanh_tuu"]{display:none!important}</style></head>');
await writeFile('dist/index.html',html);
console.log('Built original client + independent game runtime');
