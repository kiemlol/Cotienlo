import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const input=resolve('dist');
const original=await readFile(input+'/assets/index-CKacMd2p.js','utf8');
let code=original;
for(const [from,to] of [['new Gf(zp)','new window.CTLClient(zp)'],['fu.get(','window.CTLCallbacks(']]){
 if(!code.includes(from))throw Error('Client anchor missing: '+from);
 code=code.replaceAll(from,to);
}
code+='\nwindow.CTL={store:H,data:L,send:W,room:tm,enter:sm,zone:He,physics:(p,z)=>new We(je(p.x,p.y),z,I5/1000)};\n';
await writeFile('dist/assets/game-client.js',code);
await mkdir('dist/runtime',{recursive:true});
await copyFile('src/runtime.mjs','dist/runtime/runtime.mjs');
await copyFile('src/profile-defaults.mjs','dist/runtime/profile-defaults.mjs');
const data=JSON.parse(await readFile(input+'/data/game.json','utf8'));
if(data.bal?.giao_dien?.lien_he)data.bal.giao_dien.lien_he.zalo='';
await writeFile('dist/data/game.json',JSON.stringify(data));
let html=await readFile('src/index.original.html','utf8');
html=html.replace('/assets/index-CKacMd2p.js','/assets/game-client.js').replace('<title>','<title>Bản game độc lập · ');
html=html.replace(/<link rel="canonical"[^>]*>/,'').replace(/<meta property="og:url"[^>]*>/,'').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,'');
html=html.replace('<head>','<head>\n<script type="module" src="/runtime/runtime.mjs"></script>');
html=html.replace('</head>','<style>[data-nut="ung_ho"],[data-nut="tin_moi"],[data-nut="bang_tb"],[data-nut="xep_hang"],[data-nut="tim_to"],[data-nut="bang"],[data-nut="thu"],[data-nut="thanh_tuu"]{display:none!important}</style></head>');
await writeFile('dist/index.html',html);
console.log('Built original client + independent game runtime');
