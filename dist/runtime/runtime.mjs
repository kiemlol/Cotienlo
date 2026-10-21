import {createProfile} from './profile-defaults.mjs';
// Compatibility transport for the recovered production client. All rules below
// are an independent reconstruction, not recovered server code.
const baseFetch=window.fetch.bind(window);
window.fetch=(input,init)=>{
 const path=new URL(typeof input==='string'?input:input.url,location.href).pathname;
 if(path==='/api/tai-khoan/bat')return Promise.resolve(Response.json({bat:false}));
 return baseFetch(input,init);
};
const dataPromise=baseFetch('/data/game.json').then(r=>r.json());
const textPromise=baseFetch('/data/text_vi.json').then(r=>r.json());
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
  this.listeners=new Map();this.messages=new Map();this.cooldowns={};this.lastSave=0;this.meditating=false;
  this.key='ctl.playable.v1.'+(opts.key||opts.pid||'local');
  let saved;try{saved=JSON.parse(localStorage.getItem(this.key)||'null')}catch{}
  this.profile=saved?.profile||createProfile(opts.ten,opts.gioiTinh,opts.mauAo);
  this.profile.ten=opts.ten||this.profile.ten;this.progress=saved?.progress||{kills:0,herbs:0,chapter:0,training:0};
  this.zoneId=data.zones[opts.zoneId]?opts.zoneId:'zone_ta_gia_trai';
  const zone=data.zones[this.zoneId],spawn=saved?.zone===this.zoneId?saved.at:zone.spawn;
  this.player={id:'hero',ten:opts.ten,loai:'nguoi',x:spawn?.x||32,y:spawn?.y||41.5,hinh:'player_'+(opts.gioiTinh==='nu'?'nu':'nam')+(opts.mauAo?'_'+opts.mauAo:''),huong:2,hp:200,hpMax:200,cn:100,cnMax:100,theLuc:100,tocDo:1,hoiTheLuc:1,seq:0,dong:'idle',dongSeq:0,hieuUng:'',dh:'',bang:'',coChien:false,chuyen:1,giai:'so',giap:0,cong:25,thuong:0};
  this.player.hpMax=this.profile.hpMax||200;this.player.hp=Math.min(this.player.hpMax,this.profile.hp||this.player.hpMax);this.player.cn=this.profile.cn??100;this.player.chuyen=this.profile.chuyen||1;
  this.state={zoneId:this.zoneId,players:new Map([['hero',this.player]]),actors:new Map(),now:Date.now(),gio:12,thoiTiet:'nang'};
  this.physics=window.CTL.physics(this.player,window.CTL.zone(this.zoneId));
  this.spawnActors(zone);
  setTimeout(()=>{this.emit('ho_so',this.profile);this.emit('nv',{ds:[],xong:0,kyUc:[]});this.emit('vao',{zone:this.zoneId,ten:opts.ten,now:Date.now(),x:this.player.x,y:this.player.y,kenhSo:1});this.refresh();showTools();},120);
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
  for(const n of zone.noi||[]){if(n.npc_goi_y){const def=n.npc_goi_y;add({id:def,def,loai:'npc',ten:this.label('npc.'+def.replace(/^npc_/,'')+'.ten',def.replace(/^npc_/,'').replaceAll('_',' ')),hinh:def,x:n.x,y:n.y+1,hp:0,hpMax:0})}}
  if(!this.state.actors.size)add({id:'guide',def:'npc_ta_tram',loai:'npc',ten:'Người dẫn đường',hinh:'npc_ta_tram',x:this.player.x+2,y:this.player.y,hp:0,hpMax:0});
  let i=0;for(const b of zone.bai||[]){for(const def of (b.thu||[]).slice(0,2)){const spec=this.data.beast[def];if(!spec)continue;const x=b.x??b.tam?.x??zone.rong*.5,y=b.y??b.tam?.y??zone.cao*.5;for(let j=0;j<2;j++)add({id:'beast-'+i++,def,loai:'thu',ten:this.label(spec.ten_key),hinh:spec.visual,x:x+j*1.2,y:y+j*.8,sx:x+j*1.2,sy:y+j*.8})}}
  if(i===0){for(let j=0;j<4;j++)add({id:'practice-'+j,def:'beast_lon_rung',loai:'thu',ten:'Dã trư · Luyện tập',hinh:'beast_lon_rung',x:this.player.x+5+j*1.4,y:this.player.y-2,sx:this.player.x+5+j*1.4,sy:this.player.y-2})}
 }
 refresh(){const p=this.player,h=this.profile;h.hp=p.hp;h.hpMax=p.hpMax;h.cn=p.cn;h.cnMax=p.cnMax;h.nt=h.nguyenThach;h.tv.chuyen=h.chuyen;this.emit('ho_so',structuredClone(h));updateTools();}
 save(){try{localStorage.setItem(this.key,JSON.stringify({version:1,zone:this.zoneId,at:{x:this.player.x,y:this.player.y},profile:this.profile,progress:this.progress}));this.lastSave=Date.now();updateTools();return true}catch{this.notify('Không lưu được: trình duyệt đã chặn hoặc hết dung lượng.');return false}}
 stop(){clearInterval(this.timer);this.save()}
 async leave(){this.stop();this.onLeave.clear()}
 send(type,p={}){
  if(type==='in'){
   this.physics.apply(p);Object.assign(this.player,this.physics.state,{seq:p.seq});this.changed(this.player);
   if(p.dx||p.dy)this.meditating=false;
   return;
  }
  if(type==='dung'||type==='sat_chieu')return this.attack(p,type);
  if(type==='f')return this.interact(p.id);
  if(type==='thoai'){this.emit('thoai',null);return}
  if(type==='ngoi'){this.meditating=!this.meditating;this.notify(this.meditating?'Tĩnh tâm vận khí. Tu vi tăng dần; di chuyển để dừng.':'Đã dừng vận khí.');return}
  if(type==='mini'){if(p.huy)this.meditating=false;return}
  if(type==='dot_pha')return this.breakthrough();
  if(type==='chat'){this.emit('chat',{ten:this.player.ten,noi:String(p.noi||p.text||p.noiDung||''),kenh:'vung'});return}
  if(['ping','bang_tb','tin_moi','nv','push','ban_be','thu','khai_mac','huong_dan'].includes(type))return;
  if(type==='hoi_sinh'){this.player.hp=this.player.hpMax;this.emit('hoi_sinh',{});this.refresh();return}
  if(type==='co'){this.notify('Cổ khởi hành đã được luyện hóa. Các nhánh cổ nâng cao chưa có trong bản độc lập.');return}
  if(type==='roi')return this.travel('zone_ta_gia_trai');
  if(!this.cooldowns[type]||Date.now()>this.cooldowns[type]){this.cooldowns[type]=Date.now()+5000;this.notify('Tính năng này chưa được dựng trong bản chơi đơn. Dùng menu “Hành trình” để săn thú, hái thuốc, tu luyện và chuyển vùng.');}
 }
 attack(p,type){
  const special=p.o!=='tay',now=Date.now();if(now<(this.cooldowns.attack||0))return;
  if(special&&this.player.cn<8){this.notify('Không đủ chân nguyên. Nhấn X vận khí.');return}
  const enemies=[...this.state.actors.values()].filter(a=>a.loai==='thu'&&a.hp>0);
  const target=this.state.actors.get(p.muc)||enemies.sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y))[0];
  if(!target||Math.hypot(target.x-this.player.x,target.y-this.player.y)>(special?12:2.8)){this.notify('Hãy đến gần thú, chọn mục tiêu rồi tấn công.');return}
  this.cooldowns.attack=now+(special?650:350);this.meditating=false;if(special)this.player.cn-=8;
  const damage=(special?45:25)+(this.profile.chuyen||1)*5;target.hp=Math.max(0,target.hp-damage);target.aggro=now+6000;
  this.player.dong='melee';this.player.dongSeq++;this.changed(this.player);this.changed(target);
  this.emit('fx',{k:'trung',id:target.id,tu:this.sessionId,gu:special?'gu_nguyet_quang':'tay'});
  this.emit('fx',{k:'so',id:target.id,v:damage,tu:this.sessionId,loai:'dmg'});
  if(target.hp<=0){target.respawn=now+18000;this.progress.kills++;this.profile.nguyenThach=(this.profile.nguyenThach||0)+12;this.profile.tui.item_thit_thu=(this.profile.tui.item_thit_thu||0)+1;this.notify('Hạ '+target.ten+' · +12 nguyên thạch · +1 thịt thú');this.save()}
  this.refresh();
 }
 interact(id){const a=this.state.actors.get(id);const n=(this.data.zones[this.zoneId].noi||[]).find(n=>n.id===id);if(n?.toi)return this.travel(n.toi);if(n?.instance)return this.travel(n.instance);if(a&&Math.hypot(a.x-this.player.x,a.y-this.player.y)>5){this.notify('Đến gần nhân vật để trò chuyện.');return}this.player.hp=this.player.hpMax;this.player.cn=this.player.cnMax;this.emit('thoai',{loai:'thoai',ten:a?.ten||'Người dẫn đường',text:'Chào đạo hữu! Hãy săn 3 thú, thu hái 3 linh thảo và tích 100 tu vi để đột phá. Ta đã hồi phục sinh lực và chân nguyên cho con. Mở “Hành trình” để xem tiến độ.'});this.refresh()}
 gather(){const now=Date.now();if(now<(this.cooldowns.gather||0)){this.notify('Linh thảo cần 3 giây để hái tiếp.');return}this.cooldowns.gather=now+3000;this.progress.herbs++;this.profile.tui.item_thao_duoc=(this.profile.tui.item_thao_duoc||0)+1;this.notify('Đã hái 1 linh thảo.');this.save();this.refresh()}
 breakthrough(){if(this.progress.training<100){this.notify('Cần 100 tu vi. Nhấn X để vận khí.');return}const cost=30*(this.profile.chuyen||1);if((this.profile.nguyenThach||0)<cost){this.notify('Cần '+cost+' nguyên thạch để đột phá.');return}this.profile.nguyenThach-=cost;this.profile.chuyen=(this.profile.chuyen||1)+1;this.progress.training=0;this.player.hpMax+=40;this.player.hp=this.player.hpMax;this.notify('Đột phá thành công · Chuyển '+this.profile.chuyen);this.emit('len_canh',{});this.save();this.refresh()}
 reward(){if(this.progress.chapter){this.notify('Đã nhận phần thưởng khởi hành.');return}if(this.progress.kills<3||this.progress.herbs<3){this.notify('Cần hạ 3 thú và hái 3 linh thảo.');return}this.progress.chapter=1;this.profile.nguyenThach+=150;this.notify('Hoàn thành khởi hành · +150 nguyên thạch');this.save();this.refresh()}
 travel(zone){if(!this.data.zones[zone])return;this.save();this.emit('chuyen',{zone,inst:zone.startsWith('inst_')})}
 tick(){
  const now=Date.now();this.state.now=now;
  if(this.meditating){this.progress.training=Math.min(100,this.progress.training+1);this.player.hp=Math.min(this.player.hpMax,this.player.hp+2);this.player.cn=Math.min(this.player.cnMax,this.player.cn+3);this.refresh()}
  for(const a of this.state.actors.values()){
   if(a.loai!=='thu')continue;
   if(a.respawn&&now>a.respawn){a.hp=a.hpMax;a.x=a.sx;a.y=a.sy;a.respawn=0;this.changed(a)}
   if(a.hp>0&&a.aggro>now){const dx=this.player.x-a.x,dy=this.player.y-a.y,d=Math.hypot(dx,dy);if(d>1.4){a.x+=dx/d*.35;a.y+=dy/d*.35;a.dong='walk';this.changed(a)}else if(now>(a.nextHit||0)){a.nextHit=now+1400;this.player.hp=Math.max(0,this.player.hp-8);this.refresh();if(this.player.hp<=0){this.player.hp=this.player.hpMax;this.player.cn=this.player.cnMax;this.notify('Bị trọng thương. Đã được cứu chữa; không mất vật phẩm.');a.aggro=0;this.refresh()}}}
  }
  this.onStateChange.emit(this.state);if(now-this.lastSave>4000)this.save();
 }
}
let tools;
function showTools(){if(tools)return;tools=document.createElement('aside');tools.id='independent-tools';tools.innerHTML=`<style>#independent-tools{position:fixed;right:12px;top:100px;z-index:10000;color:#372717;font:14px Philosopher,serif;max-width:min(290px,90vw)}#independent-tools summary{cursor:pointer;background:#f4e5b7;border:1px solid #725430;border-radius:6px;padding:9px 13px;box-shadow:0 3px 12px #0006}#independent-tools details[open]{background:#f7eccf;border:1px solid #836039;border-radius:7px;padding:10px;box-shadow:0 6px 24px #0007}#independent-tools button,#independent-tools select{font:inherit;padding:7px;margin:4px 2px;border:1px solid #92704b;background:#fff9e9;color:#372717;border-radius:4px;cursor:pointer}#independent-tools small{display:block;line-height:1.5}#independent-tools p{margin:8px 0}#independent-tools select{max-width:250px}@media(max-width:600px){#independent-tools{top:115px;right:6px;font-size:12px}}</style><details><summary>☯ Hành trình · Bản độc lập</summary><p data-independent-stats></p><button data-game="gather">Hái linh thảo</button><button data-game="meditate">Vận khí / Dừng</button><button data-game="breakthrough">Đột phá</button><button data-game="reward">Nhận thưởng</button><button data-game="heal">Hồi phục</button><p><label>Đi đến vùng <select aria-label="Đi đến vùng" data-travel></select></label></p><button data-game="travel">Khởi hành →</button><button data-game="save">Lưu ngay</button><button data-game="export">Tải bản lưu</button><small>WASD di chuyển · Click đánh · 1–7 dùng cổ · F tương tác · X vận khí · B túi đồ · C nhân vật · M bản đồ.<br>Chơi đơn • Lưu trên trình duyệt • Không kết nối server gốc.</small><small data-save-status></small></details>`;document.body.append(tools);
 const zones=['zone_ta_gia_trai','zone_khe_coc','zone_vu_linh_ha','zone_mo_cu','zone_hac_thuy','zone_bac_linh'];
 const select=tools.querySelector('select');for(const id of zones){const o=document.createElement('option');o.value=id;o.textContent=current.label(current.data.zones[id].ten_key,id);select.append(o)}
 tools.addEventListener('click',e=>{const a=e.target.closest('[data-game]')?.dataset.game;if(!a||!current)return;if(a==='gather')current.gather();if(a==='meditate')current.send('ngoi');if(a==='breakthrough')current.breakthrough();if(a==='reward')current.reward();if(a==='heal'){current.player.hp=current.player.hpMax;current.player.cn=current.player.cnMax;current.refresh();current.notify('Đã hồi phục.')}if(a==='travel'){tools.querySelector('details').open=false;current.travel(select.value)}if(a==='save'){if(current.save())current.notify('Đã lưu tiến trình trên trình duyệt.')}if(a==='export'){current.save();const url=URL.createObjectURL(new Blob([localStorage.getItem(current.key)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='co-tien-lo-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}});
 updateTools();
}
function updateTools(){if(!tools||!current)return;const r=current;tools.querySelector('[data-independent-stats]').textContent=`${r.player.ten} · Chuyển ${r.profile.chuyen||1} · ${r.profile.nguyenThach||0} nguyên thạch\nSăn thú ${r.progress.kills}/3 · Linh thảo ${r.progress.herbs}/3 · Tu vi ${Math.floor(r.progress.training)}/100`;tools.querySelector('[data-save-status]').textContent=r.lastSave?'✓ Đã lưu lúc '+new Date(r.lastSave).toLocaleTimeString('vi-VN'):'';}
window.addEventListener('pagehide',()=>current?.save());
window.CTLGame={get room(){return current}};
