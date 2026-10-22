import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {createProfile} from '../src/profile-defaults.mjs';
import {createProgression, OCCUPATIONS} from '../src/systems/progression.mjs';

const data=JSON.parse(await readFile(new URL('../dist/data/game.json',import.meta.url),'utf8'));
const text=JSON.parse(await readFile(new URL('../dist/data/text_vi.json',import.meta.url),'utf8'));
const START=1_800_000_000_000, HOUR=3_600_000, DAY=24*HOUR;
const realNow=Date.now;
let now=START;Date.now=()=>now;
process.on('exit',()=>{Date.now=realNow;});
const slot=g=>({uid:g?.uid??null,loai:g?.loai??null,cd:0,cdMax:0,cn:0,cnGiay:false,bat:false});
const makeGu=(uid,id,extra={})=>({uid,loai:id,luyenHoa:true,banMenh:false,no:100,
  xp:0,xpCan:20,xpNgay:0,thuanThuc:0,sao:0,nghi:null,buaToi:now+DAY,...extra});

function fixture(saved,options={}) {
  now=START;
  const profile=saved?structuredClone(saved):createProfile('Tiến trình');
  if(!saved) {
    profile.nguyenThach=profile.nt=5000;
    profile.co=[makeGu('root','gu_nguyet_quang',{banMenh:true}),makeGu('shield','gu_thu_bi'),makeGu('passive','gu_tieu_quang')];
    profile.o=[slot(profile.co[0]),slot(profile.co[1]),slot()];profile.obd=['passive'];
  }
  const room={data,text,profile,zoneId:options.zone??'zone_ta_gia_trai',progress:{intro:{done:true},training:0},
    state:{now,actors:new Map()},messages:[],events:[],saves:0,refreshes:0,
    player:{x:5.4,y:32.4,hp:profile.hp??200,hpMax:profile.hpMax??200,cn:profile.cn??100,cnMax:profile.cnMax??100,
      cong:25,giap:0,tocDo:1,chuyen:profile.chuyen,giai:'so',dong:'idle',coChien:false},
    emit(type,p){this.messages.push({type,p:structuredClone(p)});},notify(message){this.emit('tb',{text:message});},
    label(key,fallback){return this.text[key]??fallback??key;}, changed(){},
    refresh(){this.refreshes++;this.progression?.recalculate();},
    save(){this.saves++;this.saved=JSON.parse(JSON.stringify(this.profile));return true;},
    onProgressionEvent(kind,p){this.events.push({kind,p});},
    travel(id){this.destination=id;},random:()=>0.999999,...options};
  const api=createProgression(room);api.begin();
  return {room,api,get h(){return room.profile;},get p(){return room.player;}};
}
function advance(f,ms,tick=true){now+=ms;f.room.state.now=now;if(tick)f.api.tick(now);}
function snap(f){return JSON.stringify({h:f.h,p:f.p});}
function unchanged(f,type,p){const before=snap(f);assert.equal(f.api.handle(type,p),true);assert.equal(snap(f),before);}
function last(f,type){return f.room.messages.filter(m=>m.type===type).at(-1)?.p;}
function recipe(f,out,station){return f.api.recipes().find(r=>r.ra[out]&&(!station||r.noi[1]===station));}
function peak(f){f.h.tv.giai=3;f.h.tv.diem=750;f.api.recalculate();}
function supplyBreakthrough(f){Object.assign(f.h.tui,Object.fromEntries(f.api.preview().nl.map(r=>[r.item,r.can])));}
function paidTrial(f){peak(f);supplyBreakthrough(f);f.api.handle('dot_pha',{hd:'vao'});f.room.zoneId='inst_dot_pha';Object.assign(f.p,{x:8,y:7});f.p.cn=f.p.cnMax;f.api.startTrial();}
function beat(f,ms=1100){f.api.handle('mini',{giu:true});advance(f,ms,false);f.api.handle('mini',{giu:false});}

test('factory is dormant during dream and preserves the base profile',()=>{
  const f=fixture();const base=structuredClone(f.h);
  const room={...f.room,profile:structuredClone(base),intro:{active:true}};
  const before=JSON.stringify(room.profile),api=createProgression(room);
  assert.equal(api.begin(),false);assert.equal(api.handle('nghe',{hd:'hoc',id:'duong_co'}),false);
  api.tick(now+DAY);api.recalculate();assert.equal(JSON.stringify(room.profile),before);
  room.intro.active=false;assert.equal(api.begin(),true);
});

test('mortal rank zero keeps zero CN and receives no Gu, money or realm promotion',()=>{
  const h={chuyen:0,tv:{chuyen:0,giai:0,diem:0,can:0},hp:300,hpMax:300,cn:0,cnMax:0,nguyenThach:0,co:[],o:[],tui:{}};
  const f=fixture(h);assert.equal(f.h.chuyen,0);assert.equal(f.p.hpMax,300);assert.equal(f.p.cnMax,0);
  assert.deepEqual(f.h.co,[]);assert.equal(f.h.nguyenThach,0);
  unchanged(f,'dot_pha',{hd:'vao'});assert.equal(f.api.addTuVi(1000),0);
  f.api.startCultivation();assert.equal(f.api.active,null);
  f.h.chuyen=1;f.p.cnMax=100;f.p.cn=100;f.api.recalculate();assert.equal(f.h.tv.can,300);assert.equal(f.p.cnMax,100);
});

test('old save stage, inventory, unknown fields and retained legacy professions survive migration',()=>{
  const h=createProfile();h.tv={chuyen:2,giai:'cao',diem:123,can:100};h.chuyen=2;
  h.custom={keep:['this']};h.nghe.ds=OCCUPATIONS.slice(0,3).map(id=>({id,chinh:true,diem:40,bac:1}));
  const original=structuredClone(h),f=fixture(h);
  assert.equal(f.h.tv.giai,2);assert.equal(f.h.tv.can,11200);assert.equal(f.h.tv.diem,123);
  assert.equal(f.h.nghe.ds.filter(j=>j.chinh).length,3);assert.equal(f.h.nghe.toiDaChinh,2);
  assert.deepEqual(f.h.tui,original.tui);assert.deepEqual(f.h.custom,original.custom);
  assert.deepEqual(h,original,'caller-owned save object is not mutated');
});

test('learn/demote/swap obey two slots, retain learned jobs and lose half of points',()=>{
  const f=fixture();for(const id of OCCUPATIONS.slice(0,3))assert.equal(f.api.handle('nghe',{hd:'hoc',id}),true);
  assert.deepEqual(f.h.nghe.ds.map(j=>j.chinh),[true,true,false]);
  f.api.gainOccupation('duong_co',51,0);f.api.recalculate();
  assert.equal(f.h.nghe.ds[0].bac,2);
  unchanged(f,'nghe',{hd:'chinh',id:'san_thuoc_da'});
  unchanged(f,'nghe',{hd:'doi',id:'san_thuoc_da',bo:'san_thuoc_da'});
  f.api.handle('nghe',{hd:'doi',id:'san_thuoc_da',bo:'duong_co'});
  assert.deepEqual(f.h.nghe.ds[0],{id:'duong_co',chinh:false,diem:25,bac:1});
  assert.equal(f.h.nghe.ds[2].chinh,true);
  f.api.handle('nghe',{hd:'bo',id:'san_thuoc_da'});assert.equal(f.h.nghe.ds[2].chinh,false);
  unchanged(f,'nghe',{hd:'hoc',id:'__proto__'});unchanged(f,'nghe',{hd:'chinh',id:'not-a-job'});
  assert.equal(f.room.saved.nghe.ds[0].diem,25);
});

test('occupation progress requires primary and work at or above current tier',()=>{
  const f=fixture();for(const id of ['duong_co','u_ruou','khai_mo'])f.api.learn(id);
  assert.equal(f.api.gainOccupation('duong_co',25,0),25);assert.equal(f.h.nghe.ds[0].bac,1);
  assert.equal(f.api.gainOccupation('duong_co',10,0),0);
  assert.equal(f.api.gainOccupation('khai_mo',10,0),0);
  assert.equal(f.api.gainOccupation('duong_co',100,1),75);assert.equal(f.h.nghe.ds[0].bac,3);
  assert.equal(f.api.gainOccupation('duong_co',-1,3),0);
});

test('official recipes and item sources expose valid ingredient and output IDs',()=>{
  const f=fixture(),rows=f.api.recipes();assert.ok(rows.length>=75);
  for(const r of rows){assert.ok(OCCUPATIONS.includes(r.nghe));for(const id of [...Object.keys(r.can),...Object.keys(r.ra)])assert.ok(data.item[id]||data.gu[id],id);}
  const deer=recipe(f,'item_ao_da_huou');assert.deepEqual(deer.can,{item_da_huou:3});assert.equal(deer.bac,0);
  assert.deepEqual(deer.noi,['zone_ta_gia_trai','bang_san']);
  assert.ok(rows.every(r=>Object.keys(r.ra).every(id=>data.item[id]||data.gu[id])),'new wiki recipes require IDs present in clone data');
});

test('first craft learns job only on success and emits original che_tao rows',()=>{
  const f=fixture(),r=recipe(f,'item_ao_da_huou');f.api.openCrafting({noi:r.noi});
  const row=last(f,'che_tao').ds.find(x=>x.ma===r.ma);assert.ok(row.khoa);assert.equal(row.can[0].co,0);
  unchanged(f,'che',{ma:r.ma,so:1});assert.equal(f.h.nghe.ds.length,0);
  f.h.tui.item_da_huou=3;const nt=f.h.nguyenThach;
  f.api.handle('che',{ma:r.ma,so:1});assert.equal(f.h.tui.item_ao_da_huou,1);assert.equal(f.h.tui.item_da_huou,undefined);
  assert.equal(f.h.nguyenThach,nt);assert.equal(f.h.nghe.ds[0].id,'san_thuoc_da');assert.equal(f.h.nghe.ds[0].diem,1);
  assert.ok(f.room.events.some(e=>e.kind==='nghe_che'));assert.equal(f.room.saved.tui.item_ao_da_huou,1);
});

test('craft rejects wrong place, quantities, missing inputs and full bag atomically',()=>{
  const f=fixture(),r=recipe(f,'item_ao_da_huou');f.h.tui.item_da_huou=20;
  for(const n of [0,-1,1.5,'1',Infinity,100,Number.MAX_SAFE_INTEGER])unchanged(f,'che',{ma:r.ma,so:n});
  f.p.x=100;unchanged(f,'che',{ma:r.ma});f.p.x=5.4;
  f.h.tuiToiDa=Object.keys(f.h.tui).length;unchanged(f,'che',{ma:r.ma});
  f.h.tuiToiDa=40;f.h.tui.item_da_huou=2;unchanged(f,'che',{ma:r.ma});
  unchanged(f,'che',{ma:'nghe:__proto__'});assert.equal(f.api.handle('che',{ma:'a-gu-recipe'}),false);
});

test('secondary jobs craft only starter recipes and never gain points',()=>{
  const f=fixture();for(const id of ['duong_co','u_ruou','san_thuoc_da'])f.api.learn(id);
  const starter=recipe(f,'item_ao_da_huou'),advanced=recipe(f,'item_ao_da_soi');
  Object.assign(f.h.tui,{item_da_huou:3,item_da_soi:20});
  f.api.handle('che',{ma:starter.ma});assert.equal(f.h.nghe.ds[2].diem,0);
  unchanged(f,'che',{ma:advanced.ma});
});

test('care follows original co.cham contract once per VN day, normalizes mastery and saves',()=>{
  const f=fixture();f.h.co[0].xp=18;
  f.api.handle('co',{cham:'root'});
  assert.equal(f.h.co[0].thuanThuc,1);assert.equal(f.h.co[0].xp,3);assert.equal(f.h.co[0].xpCan,40);
  assert.equal(f.h.co[0].xpNgay,5);unchanged(f,'co',{cham:'root'});
  unchanged(f,'co',{cham:'shield',an:'root'});unchanged(f,'co',{cham:'missing'});
  f.api.handle('co',{cham:'het'});assert.equal(f.h.chamCo.con.length,0);
  advance(f,DAY);assert.ok(f.h.chamCo.con.includes('root'));f.api.handle('co',{cham:'root'});
  assert.equal(f.h.co[0].xpNgay,5);assert.equal(f.room.saved.co[0].xp,8);
});

test('care rejects sick or unrefined Gu and respects optional explicit gate',()=>{
  const f=fixture();f.h.co[1].nghi={ly:'bi_thuong',den:now+DAY};unchanged(f,'co',{cham:'shield'});
  f.h.co[2].luyenHoa=false;unchanged(f,'co',{cham:'passive'});
  f.room.story={gates:{care:false}};unchanged(f,'co',{cham:'root'});
});

test('mastery daily reduction uses exact public tier boundaries',()=>{
  const f=fixture(),g=f.h.co[1];g.xpNgay=119;
  assert.equal(f.api.addMastery('shield',3),2);assert.equal(g.xpNgay,122);
  g.xpNgay=359;assert.equal(f.api.addMastery('shield',2),0.75);
  g.xpNgay=720;assert.equal(f.api.addMastery('shield',1),0);
  assert.equal(f.api.addMastery('shield',-1),0);
});

test('training requires yard radius, exact public fee and per-Gu daily limit',()=>{
  const f=fixture();unchanged(f,'co',{luyen_san:'root'});
  Object.assign(f.p,{x:52.6,y:40.2});const nt=f.h.nguyenThach;
  for(let i=0;i<5;i++)f.api.handle('co',{luyen_san:'root'});
  assert.equal(f.h.nguyenThach,nt-100);assert.equal(f.h.co[0].xpNgay,50);assert.equal(f.h.luyenSan.da.root,5);
  unchanged(f,'co',{luyen_san:'root'});advance(f,DAY);f.api.handle('co',{luyen_san:'root'});
  assert.equal(f.h.luyenSan.da.root,1);
});

test('nursery checks location/root/capacity, detaches slots, preserves hunger and awards hourly XP',()=>{
  const f=fixture();f.h.oDuongCo.so=1;f.api.recalculate();
  unchanged(f,'co',{duong:'shield'});f.room.zoneId='inst_gia_vien';
  unchanged(f,'co',{duong:'root'});f.api.handle('co',{duong:'shield'});
  assert.equal(f.h.oDuongCo.o[0].uid,'shield');assert.equal(f.h.o[1].uid,null);
  assert.equal(f.h.co[1].nghi.ly,'duong');assert.equal(f.h.co[1].buaToi,Number.MAX_SAFE_INTEGER);
  unchanged(f,'co',{duong:'passive'});advance(f,2*HOUR);assert.equal(f.h.co[1].xp,2);
  unchanged(f,'co',{lay_duong:5});f.api.handle('co',{lay_duong:0});
  assert.equal(f.h.co[1].nghi,null);assert.equal(f.h.co[1].buaToi,now+DAY);assert.equal(f.h.oDuongCo.o[0],null);
});

test('nursery production uses published san_xuat item/amount/period and survives JSON reload',()=>{
  const f=fixture();f.room.zoneId='inst_gia_vien';f.h.oDuongCo.so=1;
  f.h.co.push(makeGu('rice','gu_phan_dai_thao'));f.api.recalculate();f.api.handle('co',{duong:'rice'});
  advance(f,DAY);assert.equal(f.h.tui.item_gao,2);assert.equal(f.h.co.at(-1).xpNgay,24);
  const reload=fixture(f.room.saved,{zone:'inst_gia_vien'});advance(reload,2*DAY);
  assert.equal(reload.h.tui.item_gao,4);assert.equal(reload.h.oDuongCo.o[0].uid,'rice');
});

test('equipment uses exact wiki base stats and meaningful idempotent actor bonuses',()=>{
  const f=fixture();f.h.tui.item_ao_da_huou=1;const hp=f.p.hpMax;
  f.api.handle('ho_cu',{hd:'mac',id:'item_ao_da_huou'});
  assert.equal(f.p.hpMax,hp+30);assert.equal(f.p.hp,hp,'equipping does not heal');assert.equal(f.p.giap,0.3);
  assert.equal(f.h.hoCu.o.ao.chiSo.hp,30);assert.equal(f.h.tui.item_ao_da_huou,undefined);
  for(let i=0;i<20;i++)f.api.recalculate();assert.equal(f.p.hpMax,hp+30);
  const restored=fixture(f.room.saved);assert.equal(restored.p.hpMax,hp+30);
  restored.api.handle('ho_cu',{hd:'coi',o:'ao'});assert.equal(restored.p.hpMax,hp);assert.equal(restored.h.hoCu.cat.length,1);
  restored.api.handle('ho_cu',{hd:'mac',tu:'cat',i:0});assert.equal(restored.p.hpMax,hp+30);
});

test('equipment invalid targets/ranks never spend and swapping preserves bound gear',()=>{
  const f=fixture();f.h.tui.item_ao_da_gau=1;unchanged(f,'ho_cu',{hd:'mac',id:'item_ao_da_gau'});
  unchanged(f,'ho_cu',{hd:'mac',id:'__proto__'});unchanged(f,'ho_cu',{hd:'mac',tu:'cat',i:-1});
  for(const id of ['item_ao_da_huou','item_ho_cu_da_heo']){f.h.tui[id]=1;f.api.handle('ho_cu',{hd:'mac',id});}
  assert.equal(f.h.hoCu.cat[0].id,'item_ao_da_huou');assert.equal(f.h.hoCu.o.ao.id,'item_ho_cu_da_heo');
});

test('sets activate at two/four distinct equipped slots and deactivate on removal',()=>{
  const f=fixture();
  for(const id of ['item_ao_da_huou','item_giay_da_huou','item_bao_tay_da_huou','item_day_chuyen_da_huou']){
    f.h.tui[id]=1;f.api.handle('ho_cu',{hd:'mac',id});
  }
  assert.equal(f.h.hoCu.bo[0].so,4);assert.equal(f.h.hoCu.bo[0].du4,true);
  assert.ok(f.h.hoCu.tong.hp>55);const max=f.p.hpMax;
  f.api.handle('ho_cu',{hd:'coi',o:'giay'});assert.equal(f.h.hoCu.bo[0].du4,false);assert.ok(f.p.hpMax<max);
});

function preparedGear() {
  const f=fixture();f.h.tui.item_ao_da_huou=40;f.h.tui.item_da_huou=500;
  f.api.handle('ho_cu',{hd:'mac',id:'item_ao_da_huou'});return f;
}
function deposit(f){const u=f.h.hoCu.o.ao.nang;f.api.handle('ho_cu',{hd:'nap',o:'ao',vat:{nguyen_thach:u.nt-u.ntNap,...Object.fromEntries(u.can.map(c=>[c.id,c.n-c.nap]).filter(([,n])=>n>0))}});}

test('enhancement deposits are atomic and keep their balance across save/reload',()=>{
  const f=preparedGear();unchanged(f,'ho_cu',{hd:'nap',o:'ao',vat:{item_da_huou:1,bogus:1}});
  unchanged(f,'ho_cu',{hd:'nap',o:'ao',vat:{nguyen_thach:-1}});unchanged(f,'ho_cu',{hd:'len',o:'ao'});
  f.api.handle('ho_cu',{hd:'nap',o:'ao',vat:{item_da_huou:1}});assert.equal(f.h.hoCu.o.ao.nang.can[0].nap,1);
  const reload=fixture(f.room.saved);assert.equal(reload.h.hoCu.o.ao.nang.can[0].nap,1);
  deposit(reload);reload.api.handle('ho_cu',{hd:'len',o:'ao'});assert.equal(reload.h.hoCu.o.ao.cap,1);
  assert.ok(reload.p.hpMax>230);
});

test('high-level enhancement failure halves deposits, keeps level and guarantees after insurance',()=>{
  const f=preparedGear();
  for(let i=0;i<3;i++){deposit(f);f.api.handle('ho_cu',{hd:'len',o:'ao'});}
  for(let i=0;i<3;i++){deposit(f);f.api.handle('ho_cu',{hd:'len',o:'ao'});assert.equal(f.h.hoCu.o.ao.cap,3);}
  assert.equal(f.h.hoCu.o.ao.nang.chac,true);deposit(f);f.api.handle('ho_cu',{hd:'len',o:'ao'});
  assert.equal(f.h.hoCu.o.ao.cap,4);assert.equal(f.h.hoCu.o.ao.baoHiem,0);
});

test('quality combines actual copies, preserves enhancement, failure consumes half copies',()=>{
  const f=preparedGear();deposit(f);f.api.handle('ho_cu',{hd:'len',o:'ao'});
  f.api.handle('ho_cu',{hd:'thang_pham',o:'ao'});f.api.handle('ho_cu',{hd:'thang_pham',o:'ao'});
  assert.equal(f.h.hoCu.o.ao.ph,2);assert.equal(f.h.hoCu.o.ao.cap,1);
  unchanged(f,'ho_cu',{hd:'thang_pham',o:'ao'});f.h.tui.item_nanh_heo_vuong=2;
  const copies=f.h.tui.item_ao_da_huou;f.api.handle('ho_cu',{hd:'thang_pham',o:'ao'});
  assert.equal(f.h.hoCu.o.ao.ph,2);assert.equal(f.h.tui.item_ao_da_huou,copies-4);
});

test('sockets enforce grade/type limits and merge or return real inventory gems',()=>{
  const f=preparedGear();f.h.tui.item_da_bach_ho_1=4;
  unchanged(f,'ho_cu',{hd:'kham',o:'ao',i:0,da:'item_da_bach_ho_1'});
  f.api.handle('ho_cu',{hd:'thang_pham',o:'ao'});
  f.api.handle('ho_cu',{hd:'kham',o:'ao',i:0,da:'item_da_bach_ho_1'});
  assert.equal(f.h.hoCu.da.cs.sat_thuong,0.01);unchanged(f,'ho_cu',{hd:'kham',o:'ao',i:0,da:'item_da_bach_ho_1'});
  f.api.handle('ho_cu',{hd:'go_da',o:'ao',i:0});assert.equal(f.h.tui.item_da_bach_ho_1,4);
  f.api.handle('ho_cu',{hd:'ghep_da',da:'item_da_bach_ho_1'});assert.equal(f.h.tui.item_da_bach_ho_2,1);assert.equal(f.h.tui.item_da_bach_ho_1,1);
});

test('cosmetic swaps preserve ownership, do not alter combat stats and fail atomically on full bags',()=>{
  const f=fixture();f.h.tui.item_dd_non_la=1;const hp=f.p.hpMax;
  f.api.handle('do_deo',{hd:'deo',id:'item_dd_non_la'});assert.equal(f.h.doDeo.o.dau.id,'item_dd_non_la');assert.equal(f.p.hpMax,hp);
  assert.equal(f.h.tui.item_dd_non_la,undefined);unchanged(f,'do_deo',{hd:'deo',id:'item_dd_non_la'});
  f.h.tuiToiDa=Object.keys(f.h.tui).length;unchanged(f,'do_deo',{hd:'thao',o:'dau'});
  f.h.tuiToiDa=40;f.api.handle('do_deo',{hd:'thao',o:'dau'});assert.equal(f.h.tui.item_dd_non_la,1);
});

test('cultivation emits exact mini shape, charges stones, uses public cap and four-stage requirements',()=>{
  const f=fixture(undefined,{zone:'inst_dot_pha'});Object.assign(f.p,{x:8,y:7});const nt=f.h.nguyenThach;
  f.api.startCultivation();f.api.handle('mini',{tuTu:true});advance(f,1500);
  assert.equal(f.h.nguyenThach,nt-1);assert.equal(f.h.tv.diem,4);assert.equal(f.h.tv.can,300);
  assert.deepEqual(Object.keys(last(f,'mini')).sort(),['hap','hs','loai','nt','tran','tuTu','tuVi','vien'].sort());
  assert.equal(last(f,'mini').tran,30);assert.equal(last(f,'mini').tuTu,1);
  f.h.progressionV3.absorbed=30;advance(f,1500);assert.equal(f.h.tv.diem,6);
  f.h.progressionV3.absorbed=60;advance(f,1500);assert.equal(f.h.tv.diem,7);
  assert.ok(f.room.events.some(e=>e.kind==='tu_luyen'&&e.p.stones===1));
  f.api.handle('mini',{huy:true});assert.equal(f.api.active,null);assert.equal(last(f,'mini'),null);
});

test('stage promotion carries overflow, never skips breakthrough and bonuses do not compound',()=>{
  const f=fixture();const hp=f.p.hpMax;
  assert.equal(f.api.addTuVi(310),310);f.api.recalculate();assert.equal(f.h.tv.giai,1);assert.equal(f.h.tv.diem,10);assert.equal(f.h.tv.can,450);
  assert.equal(f.p.hpMax,hp+40);for(let i=0;i<10;i++)f.api.recalculate();assert.equal(f.p.hpMax,hp+40);
  f.api.addTuVi(10000);f.api.recalculate();assert.equal(f.h.chuyen,1);assert.equal(f.h.tv.giai,3);assert.equal(f.h.tv.diem,750);
  assert.equal(f.h.tv.can,750);assert.equal(f.h.dotPha.day,true);
});

test('idle sitting regenerates but never awards free tu vi, movement/damage cancels cultivation',()=>{
  const f=fixture();f.p.hp=100;f.api.handle('ngoi',{});advance(f,1000);assert.ok(f.p.hp>100);assert.equal(f.h.tv.diem,0);
  f.api.handle('f',{});assert.equal(f.api.active,'cultivation');
  assert.equal(f.api.handle('in',{dx:1,dy:0}),false);assert.equal(f.api.active,null);
  f.api.startCultivation();f.p.hp--;advance(f,1000);assert.equal(f.api.active,null);
});

test('mini inputs are exclusive to owned sessions; invalid commands do not spend',()=>{
  const f=fixture();assert.equal(f.api.handle('mini',{giu:true}),false);assert.equal(f.api.owns('mini',{}),false);
  assert.equal(f.api.handle('f',{id:'some-npc'}),false);assert.equal(f.api.handle('co',{an:'root'}),false);
  f.api.startCultivation();unchanged(f,'mini',{giu:'true'});unchanged(f,'mini',{chon:2});
  unchanged(f,'mini',{huy:true,giu:true});
  assert.equal(f.api.owns('mini',{}),true);f.api.handle('mini',{huy:true});
  assert.equal(f.api.handle('mini',{huy:true}),false);
});

test('paid breakthrough preview has original numeric tu/len, ordered conditions and all public costs',()=>{
  const f=fixture();f.api.handle('dot_pha',{hd:'xem'});const view=last(f,'dot_pha');
  assert.equal(view.tu,1);assert.equal(view.len,2);assert.equal(view.phi,100);
  assert.deepEqual(view.dk.map(d=>d.ma),['dinh_phong','nhiem_vu','nguyen_thach']);
  assert.deepEqual(Object.fromEntries(view.nl.map(r=>[r.item,r.can])),{item_thao_duoc:60,item_mat_ong:3,item_ruou_trang:2,item_nanh_heo_vuong:1,item_nguyen_tuyen_lang:1});
  assert.ok(view.nl.every(r=>r.kiem.length));unchanged(f,'dot_pha',{hd:'vao'});
  peak(f);supplyBreakthrough(f);const nt=f.h.nguyenThach;
  f.api.handle('dot_pha',{hd:'vao'});assert.equal(f.h.nguyenThach,nt-100);assert.equal(f.h.chuyen,1);
  assert.equal(f.room.destination,'inst_dot_pha');assert.equal(f.room.saved.progressionV3.breakthrough.rank,1);
});

test('optional story gate is enforced, while legacy absence does not permanently block',()=>{
  const f=fixture();peak(f);supplyBreakthrough(f);assert.equal(f.api.preview().dk[1].du,true);
  f.room.story={gates:{'breakthrough:1':false}};assert.equal(f.api.preview().dk[1].du,false);unchanged(f,'dot_pha',{hd:'vao'});
  f.room.story.gates['breakthrough:1']=true;assert.equal(f.api.preview().dk[1].du,true);
});

test('breakthrough rejects forged mini results and requires three timed release beats',()=>{
  const f=fixture();paidTrial(f);assert.equal(f.api.active,'breakthrough');
  const mini=last(f,'mini');assert.equal(mini.loai,'xung_kich');assert.equal(mini.coS,2);assert.equal(mini.can,3);
  unchanged(f,'mini',{score:999,success:true});unchanged(f,'mini',{tuTu:true});
  beat(f);assert.equal(last(f,'mini').nhip,1);f.api.handle('mini',{giu:false});assert.equal(last(f,'mini').nhip,1);
  beat(f);assert.equal(f.h.chuyen,1);beat(f);assert.equal(f.h.chuyen,2);assert.equal(f.h.tv.giai,0);
  assert.equal(f.h.tv.can,8400);assert.equal(f.api.active,null);assert.equal(f.h.progressionV3.breakthrough,undefined);
  assert.equal(f.room.saved.chuyen,2);assert.ok(f.room.events.some(e=>e.kind==='dot_pha'));
});

test('missed beats reset sequence and charge retry fee without recharging materials',()=>{
  const f=fixture();paidTrial(f);beat(f);const nt=f.h.nguyenThach;
  beat(f,200);assert.equal(last(f,'mini').nhip,0);assert.equal(f.h.nguyenThach,nt-10);
  assert.equal(f.h.progressionV3.breakthrough.failures,1);assert.equal(last(f,'mini_dap').dung,false);
  f.api.handle('mini',{huy:true});const saved=f.room.saved, reload=fixture(saved,{zone:'inst_dot_pha'});
  Object.assign(reload.p,{x:8,y:7});reload.p.cn=reload.p.cnMax;const remaining=reload.h.nguyenThach;
  reload.api.handle('dot_pha',{hd:'vao'});assert.equal(reload.h.nguyenThach,remaining);assert.equal(reload.api.active,'breakthrough');
});

test('rank-matched healthy carried wine Gu widens timing window and only its own rank',()=>{
  const f=fixture();f.h.co.push(makeGu('wine','gu_tuu_trung'));paidTrial(f);
  assert.equal(last(f,'mini').tuu,1);assert.ok(last(f,'mini').a<last(f,'mini').aGoc);
  f.h.co.at(-1).nghi={ly:'bi_thuong',den:now+DAY};f.api.tick(now);assert.equal(last(f,'mini').tuu,0);
});

test('callbacks accept pair or event object, save progress and contain downstream exceptions',()=>{
  const f=fixture();f.api.onEvent({type:'refine',uid:'root',id:'gu_nguyet_quang',success:true});
  assert.equal(f.h.nghe.ds[0].id,'luyen_co');f.api.onEvent('tu_vi',{amount:50});assert.equal(f.h.tv.diem,50);
  f.api.onEvent('mastery',{uid:'root',amount:5});assert.equal(f.h.co[0].xp,5);
  f.room.onProgressionEvent=()=>{throw Error('quest callback failed');};
  assert.doesNotThrow(()=>f.api.handle('co',{cham:'root'}));assert.equal(f.room.saved.co[0].xp,10);
});

test('create/refresh never mutate public data and JSON save roundtrip is stable',()=>{
  const before=JSON.stringify(data),f=preparedGear();f.api.learn('duong_co');f.api.handle('co',{cham:'root'});
  const save=JSON.parse(JSON.stringify(f.h)),re=fixture(save);
  assert.equal(re.p.hpMax,f.p.hpMax);assert.equal(re.h.co[0].xp,f.h.co[0].xp);
  assert.equal(re.h.nghe.ds[0].id,'duong_co');assert.equal(JSON.stringify(data),before);
});

test('rebase supports awakening and remains stable when refresh calls recalculate repeatedly',()=>{
  const h={chuyen:0,tv:{chuyen:0,giai:0,diem:0,can:0},hp:300,hpMax:300,cn:0,cnMax:0,nguyenThach:0,co:[],tui:{}};
  const f=fixture(h);f.h.chuyen=1;f.api.rebase({cnMax:100});
  for(let i=0;i<10;i++)f.room.refresh();assert.equal(f.p.cnMax,100);assert.equal(f.p.hpMax,300);
});

test('offline be quan awards published rates once, bounded by unlocked daily allowance',()=>{
  const h=createProfile();h.beQuan={mo:true,tran:8,daDung:0};
  const f=fixture(h,{previousSavedAt:START-100*HOUR});
  assert.equal(f.h.tv.diem,48);assert.equal(f.h.beQuan.daDung,8);assert.equal(f.api.active,null);
  f.api.begin();assert.equal(f.h.tv.diem,48);
  const re=fixture(f.room.saved,{previousSavedAt:START-100*HOUR});assert.equal(re.h.tv.diem,48);
  assert.ok(f.room.events.some(e=>e.kind==='be_quan'&&e.p.hours===8));
});

test('offline be quan ignores locked, future or missing timestamps and mortal saves',()=>{
  const h=createProfile();h.beQuan.mo=false;
  const locked=fixture(h,{previousSavedAt:START-DAY});assert.equal(locked.h.tv.diem,0);
  h.beQuan.mo=true;const future=fixture(h,{previousSavedAt:START+DAY});assert.equal(future.h.tv.diem,0);
  const missing=fixture(h);assert.equal(missing.h.tv.diem,0);
  h.chuyen=0;h.tv.chuyen=0;h.tv.can=0;const mortal=fixture(h,{previousSavedAt:START-DAY});assert.equal(mortal.h.tv.diem,0);
});
