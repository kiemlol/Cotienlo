import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist'), port=Number(process.env.PORT||4175);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff':'font/woff','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg','.webm':'audio/webm','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{let p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(p!==root&&!p.startsWith(root+sep))throw Error();if((await stat(p)).isDirectory())p=resolve(p,'index.html');const b=await readFile(p);res.writeHead(200,{'content-type':types[extname(p)]||'application/octet-stream','cache-control':'no-cache'});res.end(req.method==='HEAD'?undefined:b);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log('Game preview http://127.0.0.1:'+port));
