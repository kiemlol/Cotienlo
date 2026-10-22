import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {createIntro} from '../src/systems/intro.mjs';import {createProfile} from '../src/profile-defaults.mjs';
const data=JSON.parse(await readFile('dist/data/game.json','utf8')),text=JSON.parse(await readFile('dist/data/text_vi.json','utf8'));
function mock(step='opening'){
 const profile=createProfile('Test','nam','cham');profile.chuyen=2;profile.nguyenThach=432;
 const messages=[],p={x:9,y:39,hp:240,hpMax:240,cn:100,cnMax:100};
 const room={zoneId:'inst_mo_dau',sessionId:'hero',profile,data,player:p,options:{},text,progress:{kills:7,intro:{step,done:false}},state:{actors:new Map()},label:k=>text[k]||k,changed(){},emit:(t,p)=>messages.push({t,p}),refresh(){},save(){},notify(){},teleport(x,y){p.x=x;p.y=y},travel(z){room.destination=z}};
 const intro=createIntro(room);room.intro=intro;return {room,intro,messages};
}
const {room:r,intro:i,messages}=mock();assert.equal(r.profile.chuyen,5);assert.equal(r.player.hp,5200);assert.equal(r.player.cn,2400);assert.equal(r.profile.o.length,6);assert.equal(r.state.actors.size,2);assert.equal(r.data.gu.gu_hoa_long.hu[0].goc,360);
i.begin();assert.equal(messages.at(-1).p.text,'Giấc mơ ấy lại tới.');for(let k=0;k<3;k++)i.handle('thoai');assert.equal(i.stage,'move');
r.teleport(16.5,38);i.onAction('in',{});assert.equal(i.stage,'collapse');for(let k=0;k<3;k++)i.handle('thoai');assert.equal(i.stage,'dash');
r.teleport(10,17);i.onAction('in',{});assert.equal(i.stage,'fly');r.teleport(28,16);i.onAction('in',{});assert.equal(i.stage,'arena');r.teleport(34,16);i.onAction('in',{});assert.equal(i.stage,'confront');for(let k=0;k<5;k++)i.handle('thoai');assert.equal(i.stage,'attack');
i.onAction('dung',{o:1},{ok:false});assert.equal(i.stage,'attack','rejected spells never advance');
i.onAction('dung',{o:1},{ok:true});assert.equal(i.stage,'guard');i.onAction('dung',{o:2},{ok:true});assert.equal(i.stage,'heal');i.onAction('dung',{o:3},{ok:true});assert.equal(i.stage,'scout');i.handle('dung',{o:4});assert.equal(i.stage,'free');
for(let k=0;k<3;k++)i.onAction('dung',{o:0},{ok:true});assert.equal(i.stage,'absorb');i.handle('hap',{giu:true});for(let k=0;k<8;k++)i.tick(Date.now()+1000*k+1000);assert.equal(i.stage,'ultimate');
i.handle('sat_chieu',{o:0});for(let k=0;k<3;k++)i.handle('thoai');assert.equal(i.stage,'enrage');i.onAction('in',{luot:true});i.onAction('dung',{o:0},{ok:true});i.onAction('dung',{o:0},{ok:true});assert.equal(i.stage,'overpower');for(let k=0;k<3;k++)i.handle('thoai');assert.equal(i.stage,'choice');i.handle('thoai',{chon:0});assert.equal(i.stage,'self');i.handle('mini',{giu:true});for(let k=0;k<6;k++)i.tick(Date.now()+10000+1000*k);assert.equal(i.stage,'ending');for(let k=0;k<16&&i.stage!=='done';k++)i.handle('thoai');assert.equal(i.stage,'done');assert.equal(r.destination,'zone_ta_gia_trai');assert.equal(r.profile.chuyen,2);assert.equal(r.profile.nguyenThach,432);assert.equal(r.progress.kills,7);assert.equal(r.player.hpMax,200);assert(r.profile.xong.includes('mq_mo_dau'));
const resumed=mock('scout');resumed.intro.begin();assert.equal(resumed.intro.stage,'scout');resumed.intro.handle('dung',{o:4});assert.equal(resumed.intro.stage,'free');
console.log('Intro tests PASS: full action sequence, exact initial profile/actors/guides, rejected casts, absorption/ultimate/self-charge, resume and preserved existing progress.');
