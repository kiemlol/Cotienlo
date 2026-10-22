import {createMortalProfile} from './profile-defaults.mjs';
import {createIntro} from './systems/intro.mjs';
import {attachGuInventory} from './systems/gu-inventory.mjs';
import {createCombat} from './systems/combat.mjs';
import {createStory} from './systems/story.mjs';
import {createEncounters} from './systems/encounters.mjs';
import {createProgression} from './systems/progression.mjs';
import {showJourney,updateJourney} from './systems/journey-ui.mjs';
import {createServices} from './systems/services.mjs';
// Compatibility transport for the recovered production client. All rules below
// are an independent reconstruction, not recovered server code.
const baseFetch=window.fetch.bind(window);
window.fetch=(input,init)=>{
 const path=new URL(typeof input==='string'?input:input.url,location.href).pathname;
 if(path==='/api/tai-khoan/bat'||path==='/ws/api/tai-khoan/bat')return Promise.resolve(Response.json({bat:false}));
 if(['/data/game.json','/data/text_vi.json','/assets/visual/index.json'].includes(path)){const u=new URL(path,location.href);u.searchParams.set('v','20261022');return baseFetch(u.href,init);}
 return baseFetch(input,init);
};
const dataPromise=baseFetch('/data/game.json?v=20261022').then(r=>r.json());
const textPromise=baseFetch('/data/text_vi.json?v=20261022').then(r=>r.json());
const hooks=new WeakMap();
const signal=()=>{const all=new Set();const fn=cb=>{all.add(cb);return()=>all.delete(cb)};fn.once=cb=>{const off=fn((...a)=>{off();cb(...a)});return off};fn.emit=(...a)=>{for(const cb of [...all])cb(...a)};fn.clear=()=>all.clear();return fn;};
window.CTLCallbacks=room=>{
 if(!hooks.has(room))hooks.set(room,{
  onAdd:(name,fn,immediate=true)=>{if(immediate)room.state[name]?.forEach((v,k)=>fn(v,k));return room.events('add:'+name,fn)},
  onRemove:(name,fn)=>room.events('remove:'+name,fn),
  onChange:(obj,fn)=>room.events(obj,fn),
  listen:(obj,name,fn)=>{if(typeof obj==='string'){fn=name;name=obj;obj=room.state}fn(obj[name]);return room.events(obj,()=>fn(obj[name]));}
 });
 return hooks.get(room);
};
window.CTLClient=class{
 async joinOrCreate(type,opts){return this.create(type,opts)}
 async joinById(type,opts){return this.create(type,opts)}
 async create(type,opts){const [data,text]=await Promise.all([dataPromise,textPromise]);return new Room(opts,data,text)}
};
let current=null;
class Room{
 constructor(opts,data,text){
  current?.stop();current=this;this.data=data;this.text=text;this.options=opts;
  this.roomId='doc-hanh';this.sessionId='hero';this.reconnection={};this.onStateChange=signal();this.onLeave=signal();this.onError=signal();
  this.listeners=new Map();this.messages=new Map();this.cooldowns={};this.lastSave=0;this.meditating=false;this.unsupported=new Set();this.started=Date.now();
  this.key='ctl.playable.v1.'+(opts.key||opts.pid||'local');
  let saved;try{saved=JSON.parse(localStorage.getItem(this.key)||'null')}catch{}
  this.previousSavedAt=saved?.savedAt;
  this.profile=saved?.profile||createMortalProfile(opts.ten,opts.gioiTinh,opts.mauAo);
  this.profile.ten=opts.ten||this.profile.ten;this.progress=saved?.progress||{kills:0,herbs:0,chapter:0,training:0};
  this.progress.intro??={step:'opening',done:false};
  this.zoneId=!this.progress.intro.done?'inst_mo_dau':data.zones[opts.zoneId]?opts.zoneId:'zone_ta_gia_trai';
  const zone=data.zones[this.zoneId],pending=this.progress.pendingSpawn;
  const spawn=pending?.zone===this.zoneId?pending:saved?.zone===this.zoneId?saved.at:zone.spawn;
  if(pending?.zone===this.zoneId)delete this.progress.pendingSpawn;
  this.player={id:'hero',ten:opts.ten,loai:'nguoi',x:spawn?.x||32,y:spawn?.y||41.5,hinh:'player_'+(opts.gioiTinh==='nu'?'nu':'nam')+(opts.mauAo?'_'+opts.mauAo:''),huong:2,hp:200,hpMax:200,cn:100,cnMax:100,theLuc:100,tocDo:1,hoiTheLuc:1,seq:0,dong:'idle',dongSeq:0,hieuUng:'',dh:'',bang:'',coChien:false,chuyen:1,giai:'so',giap:0,cong:25,thuong:0};
  this.player.hpMax=this.profile.hpMax??300;this.player.hp=Math.min(this.player.hpMax,this.profile.hp??this.player.hpMax);this.player.cn=this.profile.cn??0;this.player.cnMax=this.profile.cnMax??0;this.player.chuyen=this.profile.chuyen??0;
  this.state={zoneId:this.zoneId,players:new Map([['hero',this.player]]),actors:new Map(),now:Date.now(),gio:12,thoiTiet:'nang'};
  this.intro=createIntro(this);
  this.physics=window.CTL.physics(this.player,window.CTL.zone(this.zoneId));
  if(!this.intro)this.spawnActors(zone);
  this.onInventoryEvent=(kind,payload)=>{if(typeof kind==='object'){payload=kind;kind=kind.type;}this.story?.onEvent(kind,payload||{});this.progression?.onEvent(kind,payload||{});};
  this.onProgressionEvent=(kind,payload)=>this.story?.onEvent(kind,payload||{});
  this.onEncounterEvent=(kind,payload)=>{this.story?.onEvent(kind,payload||{});if(kind==='tu_vi')this.progression?.onEvent('tu_vi',payload);};
  this.onCombatAction=result=>{this.story?.onAction(result.type,result.p,result);this.encounters?.onAction(result.type,result.p,result);if(result.type==='dung'&&result.gu&&result.targets?.some(id=>['thu','doi_thu'].includes(this.state.actors.get(id)?.loai))){const uid=this.profile.o[result.p.o]?.uid;if(uid)this.progression?.onEvent('mastery',{uid,amount:1});}};
  this.onKill=(actor,context)=>{if(this.intro?.active||actor.noReward||actor.storyDummy)return;const handled=this.encounters?.onKill(actor,context);if(actor.hp<=0){this.story?.onKill(actor);this.services?.onKill(actor)}if(!handled){this.progress.kills++;this.profile.nguyenThach=(this.profile.nguyenThach||0)+1;this.refresh();this.save();}};
  this.encountersPaused=()=>!!this.story?.activeScene;
  this.inventory=attachGuInventory(this);this.combat=createCombat(this);
  this.progression=this.intro?null:createProgression(this);
  this.story=createStory(this);this.encounters=createEncounters(this);this.services=this.intro?null:createServices(this);
  setTimeout(()=>{this.emit('ho_so',this.profile);this.emit('vao',{zone:this.zoneId,ten:opts.ten,now:Date.now(),x:this.player.x,y:this.player.y,kenhSo:1});this.refresh();showTools();this.intro?.begin();this.story?.begin();this.progression?.begin?.();this.encounters?.begin();},120);
  this.timer=setInterval(()=>this.tick(),250);
 }
 label(key,fallback){return this.text[key]||fallback||key}
 events(key,fn){if(!this.listeners.has(key))this.listeners.set(key,new Set());this.listeners.get(key).add(fn);return()=>this.listeners.get(key)?.delete(fn)}
 changed(key){for(const fn of [...(this.listeners.get(key)||[])])fn();this.onStateChange.emit(this.state)}
 onMessage(type,fn){if(!this.messages.has(type))this.messages.set(type,new Set());this.messages.get(type).add(fn);return()=>this.messages.get(type)?.delete(fn)}
 emit(type,payload){for(const fn of [...(this.messages.get(type)||[])])fn(payload);for(const fn of [...(this.messages.get('*')||[])])fn(type,payload)}
 notify(text){this.emit('tb',{text,loai:'he_thong'})}
 spawnActors(zone){
  const add=a=>this.state.actors.set(a.id,{co:1,huong:2,dong:'idle',dongSeq:0,hieuUng:'',hp:80,hpMax:80,bac:'thuong',...a});
  for(const n of zone.noi||[]){if(n.npc_goi_y){const def=n.npc_goi_y;add({id:def,def,loai:'npc',tuongTac:true,ten:this.label('npc.'+def.replace(/^npc_/,'')+'.ten',def.replace(/^npc_/,'').replaceAll('_',' ')),hinh:def,x:n.x,y:n.y+1,hp:0,hpMax:0})}}
  if(!this.state.actors.size)add({id:'guide',def:'npc_ta_tram',loai:'npc',ten:'Người dẫn đường',hinh:'npc_ta_tram',x:this.player.x+2,y:this.player.y,hp:0,hpMax:0});
  // Encounter ownership, real group sizes and respawns belong to encounters.
 }
 refresh(){this.progression?.recalculate();this.services?.refresh();const p=this.player,h=this.profile;h.hp=p.hp;h.hpMax=p.hpMax;h.cn=p.cn;h.cnMax=p.cnMax;h.nt=h.nguyenThach;h.tv.chuyen=h.chuyen;this.emit('ho_so',structuredClone(h));updateTools();}
 save(){try{localStorage.setItem(this.key,JSON.stringify({version:3,zone:this.zoneId,at:{x:this.player.x,y:this.player.y},profile:this.intro?.active?this.intro.baseProfile:this.profile,progress:this.progress,savedAt:Date.now()}));this.lastSave=Date.now();updateTools();return true}catch{this.notify('Không lưu được: trình duyệt đã chặn hoặc hết dung lượng.');return false}}
 stop(){clearInterval(this.timer);this.save()}
 async leave(){this.stop();this.onLeave.clear()}
 addActor(a){this.state.actors.set(a.id,a);for(const fn of this.listeners.get('add:actors')||[])fn(a,a.id);this.onStateChange.emit(this.state);}
 removeActor(id){const a=this.state.actors.get(id);if(!a)return;this.state.actors.delete(id);for(const fn of this.listeners.get('remove:actors')||[])fn(a,id);this.onStateChange.emit(this.state);}
 teleport(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return;this.player.x=x;this.player.y=y;this.physics=window.CTL.physics(this.player,window.CTL.zone(this.zoneId));this.changed(this.player);this.emit('dich',{x,y,mo:true});}
 send(type,p={}){
  if(this.intro?.handle(type,p))return;
  if(this.story?.handle(type,p))return;
  if(this.story?.activeScene&&['in','dung','sat_chieu','f','hap','mini'].includes(type))return;
  if(this.services?.handle(type,p))return;
  if(type==='f')return this.interact(p.id);
  if(this.encounters?.handle(type,p))return;
  if(this.progression?.owns(type,p)&&this.progression.handle(type,p))return;
  if(this.inventory?.handle(type,p))return;
  if(this.progression?.handle(type,p))return;
  if(type==='in'){
   const now=Date.now();
   if(this.player.hp<=0||this.player.trongThuong||this.player.combatStunUntil>now||this.player.combatRootUntil>now){p={...p,dx:0,dy:0,luot:false};if(this.physics.state)this.physics.state.luotConLai=0;}
   const factor=this.player.tocDo||1;
   if(this.physics.b)this.physics.b={...this.physics.b,tocDo:5*factor,quaHo:!!this.player.canh};
   this.physics.apply(p);Object.assign(this.player,this.physics.state,{seq:p.seq});this.changed(this.player);
   if(p.dx||p.dy)this.meditating=false;
   this.intro?.onAction(type,p);
   this.story?.onAction(type,p);this.encounters?.onAction(type,p);
   return;
  }
  if(type==='dung'||type==='sat_chieu'){const result=this.combat.attack(p,type);this.intro?.onAction(type,p,result);return result;}
  if(type==='f')return this.interact(p.id);
  if(type==='thoai'){
   this.emit('thoai',null);
   if(p.chon==='shop')return this.inventory.handle('cua_hang',{});
   if(p.chon==='craft')return this.inventory.handle('che_tao',{});
   if(p.chon==='train')return this.startCultivation();
   if(p.chon==='heal'){this.player.hp=this.player.hpMax;this.player.cn=this.player.cnMax;this.refresh();this.notify('Đã hồi phục sinh lực và chân nguyên.');}
   return;
  }
  if(type==='ngoi'){this.meditating=!this.meditating;this.notify(this.meditating?'Tĩnh tâm vận khí. Tu vi tăng dần; di chuyển để dừng.':'Đã dừng vận khí.');return}
  if(type==='mini'){if(p.huy){this.meditating=false;this.cultivating=false;this.absorbing=false;this.emit('mini',null);}else if(this.cultivating){if(p.giu!==undefined)this.absorbing=!!p.giu;if(p.tuTu!==undefined)this.autoCultivate=!!p.tuTu;}return}
  if(type==='hap'){this.absorbing=!!p.giu;return}
  if(type==='dot_pha'){if(p.hd==='xem')return this.breakthroughPreview();this.breakthrough();return}
  if(type==='o_do'){
   if(!Number.isInteger(p.o)||p.o<0||p.o>1||!(p.id===null||(typeof p.id==='string'&&Object.hasOwn(this.data.item,p.id)&&this.data.item[p.id].loai==='tieu_hao'&&this.profile.tui[p.id]>0))){this.notify('Ô vật phẩm không hợp lệ.');return}
   this.profile.oDo??=[null,null];this.profile.oDo[p.o]=p.id;this.refresh();this.save();return;
  }
  if(type==='chat'){const noi=typeof p==='string'?p:String(p.noi||p.text||p.noiDung||'');if(noi.trim())this.emit('chat',{tu:this.player.ten,noi:noi.slice(0,500),kenh:'vung'});return}
  if(['ping','bang_tb','tin_moi','nv','push','ban_be','thu','khai_mac','huong_dan','manh_len_xem','giai_dau','loan_chien','ghep_to'].includes(type))return;
  if(type==='hoi_sinh'||type==='ve'){this.player.hp=this.player.hpMax;this.player.trongThuong=false;this.wasDead=false;this.emit('hoi_sinh',{});this.encounters?.onAction(type,p);this.refresh();this.save();return}
  if(type==='co'){this.notify('Cổ khởi hành đã được luyện hóa. Các nhánh cổ nâng cao chưa có trong bản độc lập.');return}
  if(type==='roi')return this.travel('zone_ta_gia_trai');
  this.unsupported.add(type);
  if(Date.now()-this.started>5000&&(!this.cooldowns[type]||Date.now()>this.cooldowns[type])){this.cooldowns[type]=Date.now()+5000;this.notify('Tính năng này chưa được dựng trong bản chơi đơn. Dùng menu “Hành trình” để săn thú, hái thuốc, tu luyện và chuyển vùng.');}
 }
 interact(id){
  const a=this.state.actors.get(id),n=(this.data.zones[this.zoneId].noi||[]).find(n=>n.id===id);
  const point=a||n;if(!point||Math.hypot(point.x-this.player.x,point.y-this.player.y)>5){this.notify('Đến gần nhân vật hoặc địa điểm để tương tác.');return}
  if(this.story?.interact(id))return;
  if(this.progression?.handle('f',{id}))return;
  if(this.encounters?.onInteract(id))return;
  if(n?.toi)return this.travel(n.toi,{den_spawn:n.den_spawn});if(n?.instance)return this.travel(n.instance);
  if(n?.loai==='nguon_hai')return this.gather();
  const ten=a?.ten||this.label(n?.ten_key||id);
  this.emit('thoai',{loai:'lua_chon',tieuDe:ten,npc:a?.def||'',cac:[{i:'shop',text:'Mua bán vật phẩm / đổi cổ'},{i:'craft',text:'Xem cổ phương và hợp luyện'},{i:'train',text:'Tu luyện chân nguyên'},{i:'heal',text:'Nhờ chữa thương'},{i:'close',text:'Để khi khác'}]});
 }
 startCultivation(){if(this.progression?.startCultivation)return this.progression.startCultivation();this.cultivating=true;this.absorbing=false;this.autoCultivate=false;this.cultivationMini();}
 cultivationMini(){this.emit('mini',{loai:'tu_luyen',tuVi:this.progress.training,nt:Math.floor(this.profile.nguyenThach||0),vien:this.progress.cultivationStones||0,hap:this.progress.cultivationStones||0,tran:60,hs:1,tuTu:+!!this.autoCultivate});}
 breakthroughPreview(){return this.progression?.handle('dot_pha',{hd:'xem'})}
 gather(){const now=Date.now();if(now<(this.cooldowns.gather||0)){this.notify('Linh thảo cần 3 giây để hái tiếp.');return}this.cooldowns.gather=now+3000;this.progress.herbs++;this.profile.tui.item_thao_duoc=(this.profile.tui.item_thao_duoc||0)+1;this.notify('Đã hái 1 linh thảo.');this.save();this.refresh()}
 breakthrough(){return this.progression?.handle('dot_pha',{hd:'xem'})}
 reward(){if(this.progress.chapter){this.notify('Đã nhận phần thưởng khởi hành.');return}if(this.progress.kills<3||this.progress.herbs<3){this.notify('Cần hạ 3 thú và hái 3 linh thảo.');return}this.progress.chapter=1;this.profile.nguyenThach+=150;this.notify('Hoàn thành khởi hành · +150 nguyên thạch');this.save();this.refresh()}
 travel(zone,options={}){const target=this.data.zones[zone];if(!target)return false;if(this.story?.activeScene){this.notify('Hãy xem hết hoặc bỏ qua đoạn truyện trước.');return false}this.encounters?.onTravel(zone,options);const spawn=options.den_spawn&&(target.spawns?.[options.den_spawn]||(target.noi||[]).find(n=>n.id===options.den_spawn));if(spawn)this.progress.pendingSpawn={zone,x:spawn.x,y:spawn.y};this.save();this.emit('chuyen',{zone,inst:zone.startsWith('inst_'),...options});return true}
 tick(){
  const now=Date.now();this.state.now=now;
  this.intro?.tick(now);this.inventory?.tick(now);this.story?.tick(now);
  if(!this.story?.activeScene){this.progression?.tick(now);this.combat?.tick(now);this.encounters?.tick(now);}
  if(!this.intro?.active&&this.player.hp<=0&&!this.wasDead){this.wasDead=true;this.player.trongThuong=true;this.emit('nga',{giay:5,inst:this.zoneId.startsWith('inst_')});}
  this.onStateChange.emit(this.state);if(now-this.lastSave>4000)this.save();
 }
}
function showTools(){showJourney(()=>current)}
function updateTools(){updateJourney(current)}
window.addEventListener('pagehide',()=>current?.save());
window.CTLGame={get room(){return current}};
