import {createProfile} from './profile-defaults.mjs';
import {createIntro} from './systems/intro.mjs';
import {attachGuInventory} from './systems/gu-inventory.mjs';
import {createCombat} from './systems/combat.mjs';
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
  this.profile=saved?.profile||createProfile(opts.ten,opts.gioiTinh,opts.mauAo);
  this.profile.ten=opts.ten||this.profile.ten;this.progress=saved?.progress||{kills:0,herbs:0,chapter:0,training:0};
  this.progress.intro??={step:'opening',done:false};
  this.zoneId=!this.progress.intro.done?'inst_mo_dau':data.zones[opts.zoneId]?opts.zoneId:'zone_ta_gia_trai';
  const zone=data.zones[this.zoneId],pending=this.progress.pendingSpawn;
  const spawn=pending?.zone===this.zoneId?pending:saved?.zone===this.zoneId?saved.at:zone.spawn;
  if(pending?.zone===this.zoneId)delete this.progress.pendingSpawn;
  this.player={id:'hero',ten:opts.ten,loai:'nguoi',x:spawn?.x||32,y:spawn?.y||41.5,hinh:'player_'+(opts.gioiTinh==='nu'?'nu':'nam')+(opts.mauAo?'_'+opts.mauAo:''),huong:2,hp:200,hpMax:200,cn:100,cnMax:100,theLuc:100,tocDo:1,hoiTheLuc:1,seq:0,dong:'idle',dongSeq:0,hieuUng:'',dh:'',bang:'',coChien:false,chuyen:1,giai:'so',giap:0,cong:25,thuong:0};
  this.player.hpMax=this.profile.hpMax||200;this.player.hp=Math.min(this.player.hpMax,this.profile.hp||this.player.hpMax);this.player.cn=this.profile.cn??100;this.player.chuyen=this.profile.chuyen||1;
  this.state={zoneId:this.zoneId,players:new Map([['hero',this.player]]),actors:new Map(),now:Date.now(),gio:12,thoiTiet:'nang'};
  this.intro=createIntro(this);
  this.physics=window.CTL.physics(this.player,window.CTL.zone(this.zoneId));
  if(!this.intro)this.spawnActors(zone);
  this.inventory=attachGuInventory(this);this.combat=createCombat(this);
  setTimeout(()=>{this.emit('ho_so',this.profile);this.emit('nv',{ds:[],xong:0,kyUc:[]});this.emit('vao',{zone:this.zoneId,ten:opts.ten,now:Date.now(),x:this.player.x,y:this.player.y,kenhSo:1});this.refresh();showTools();this.intro?.begin();},120);
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
  let i=0;for(const b of zone.bai||[]){for(const def of (b.thu||[]).slice(0,2)){const spec=this.data.beast[def];if(!spec)continue;const x=b.x??b.tam?.x??zone.rong*.5,y=b.y??b.tam?.y??zone.cao*.5;for(let j=0;j<2;j++)add({id:'beast-'+i++,def,loai:'thu',ten:this.label(spec.ten_key),hinh:spec.visual,x:x+j*1.2,y:y+j*.8,sx:x+j*1.2,sy:y+j*.8})}}
 }
 refresh(){const p=this.player,h=this.profile;h.hp=p.hp;h.hpMax=p.hpMax;h.cn=p.cn;h.cnMax=p.cnMax;h.nt=h.nguyenThach;h.tv.chuyen=h.chuyen;this.emit('ho_so',structuredClone(h));updateTools();}
 save(){try{localStorage.setItem(this.key,JSON.stringify({version:2,zone:this.zoneId,at:{x:this.player.x,y:this.player.y},profile:this.intro?.active?this.intro.baseProfile:this.profile,progress:this.progress}));this.lastSave=Date.now();updateTools();return true}catch{this.notify('Không lưu được: trình duyệt đã chặn hoặc hết dung lượng.');return false}}
 stop(){clearInterval(this.timer);this.save()}
 async leave(){this.stop();this.onLeave.clear()}
 addActor(a){this.state.actors.set(a.id,a);for(const fn of this.listeners.get('add:actors')||[])fn(a,a.id);this.onStateChange.emit(this.state);}
 removeActor(id){const a=this.state.actors.get(id);if(!a)return;this.state.actors.delete(id);for(const fn of this.listeners.get('remove:actors')||[])fn(a,id);this.onStateChange.emit(this.state);}
 teleport(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return;this.player.x=x;this.player.y=y;this.physics=window.CTL.physics(this.player,window.CTL.zone(this.zoneId));this.changed(this.player);this.emit('dich',{x,y,mo:true});}
 send(type,p={}){
  if(this.intro?.handle(type,p))return;
  if(this.inventory?.handle(type,p))return;
  if(type==='in'){
   const factor=this.player.tocDo||1;
   if(this.physics.b)this.physics.b={...this.physics.b,tocDo:5*factor,quaHo:!!this.player.canh};
   this.physics.apply(p);Object.assign(this.player,this.physics.state,{seq:p.seq});this.changed(this.player);
   if(p.dx||p.dy)this.meditating=false;
   this.intro?.onAction(type,p);
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
  if(type==='hoi_sinh'||type==='ve'){this.player.hp=this.player.hpMax;this.player.trongThuong=false;this.wasDead=false;this.emit('hoi_sinh',{});this.refresh();this.save();return}
  if(type==='co'){this.notify('Cổ khởi hành đã được luyện hóa. Các nhánh cổ nâng cao chưa có trong bản độc lập.');return}
  if(type==='roi')return this.travel('zone_ta_gia_trai');
  this.unsupported.add(type);
  if(Date.now()-this.started>5000&&(!this.cooldowns[type]||Date.now()>this.cooldowns[type])){this.cooldowns[type]=Date.now()+5000;this.notify('Tính năng này chưa được dựng trong bản chơi đơn. Dùng menu “Hành trình” để săn thú, hái thuốc, tu luyện và chuyển vùng.');}
 }
 interact(id){
  const a=this.state.actors.get(id),n=(this.data.zones[this.zoneId].noi||[]).find(n=>n.id===id);
  const point=a||n;if(!point||Math.hypot(point.x-this.player.x,point.y-this.player.y)>5){this.notify('Đến gần nhân vật hoặc địa điểm để tương tác.');return}
  if(n?.toi)return this.travel(n.toi);if(n?.instance)return this.travel(n.instance);
  if(n?.loai==='nguon_hai')return this.gather();
  const ten=a?.ten||this.label(n?.ten_key||id);
  this.emit('thoai',{loai:'lua_chon',tieuDe:ten,npc:a?.def||'',cac:[{i:'shop',text:'Mua bán vật phẩm / đổi cổ'},{i:'craft',text:'Xem cổ phương và hợp luyện'},{i:'train',text:'Tu luyện chân nguyên'},{i:'heal',text:'Nhờ chữa thương'},{i:'close',text:'Để khi khác'}]});
 }
 startCultivation(){this.cultivating=true;this.absorbing=false;this.autoCultivate=false;this.cultivationMini();}
 cultivationMini(){this.emit('mini',{loai:'tu_luyen',tuVi:this.progress.training,nt:Math.floor(this.profile.nguyenThach||0),vien:this.progress.cultivationStones||0,hap:this.progress.cultivationStones||0,tran:60,hs:1,tuTu:+!!this.autoCultivate});}
 breakthroughPreview(){const phi=30*(this.profile.chuyen||1),tv=this.progress.training,money=this.profile.nguyenThach||0;this.emit('dot_pha',{tu:{chuyen:this.profile.chuyen,giai:this.profile.tv.giai||0},len:{chuyen:this.profile.chuyen+1,giai:0},phi,daNop:false,tran:false,xemTruoc:false,thieu:Number(tv<100)+Number(money<phi),dk:[{ma:'dinh_phong',du:tv>=100,giai:3,phan:tv/100},{ma:'nhiem_vu',du:true},{ma:'nguyen_thach',du:money>=phi,co:money,can:phi}],nl:[]});}
 gather(){const now=Date.now();if(now<(this.cooldowns.gather||0)){this.notify('Linh thảo cần 3 giây để hái tiếp.');return}this.cooldowns.gather=now+3000;this.progress.herbs++;this.profile.tui.item_thao_duoc=(this.profile.tui.item_thao_duoc||0)+1;this.notify('Đã hái 1 linh thảo.');this.save();this.refresh()}
 breakthrough(){if(this.progress.training<100){this.notify('Cần 100 tu vi. Nhấn X để vận khí.');return}const cost=30*(this.profile.chuyen||1);if((this.profile.nguyenThach||0)<cost){this.notify('Cần '+cost+' nguyên thạch để đột phá.');return}this.profile.nguyenThach-=cost;this.profile.chuyen=(this.profile.chuyen||1)+1;this.progress.training=0;this.player.hpMax+=40;this.player.hp=this.player.hpMax;this.notify('Đột phá thành công · Chuyển '+this.profile.chuyen);this.emit('len_canh',{});this.save();this.refresh()}
 reward(){if(this.progress.chapter){this.notify('Đã nhận phần thưởng khởi hành.');return}if(this.progress.kills<3||this.progress.herbs<3){this.notify('Cần hạ 3 thú và hái 3 linh thảo.');return}this.progress.chapter=1;this.profile.nguyenThach+=150;this.notify('Hoàn thành khởi hành · +150 nguyên thạch');this.save();this.refresh()}
 travel(zone){if(!this.data.zones[zone])return;this.save();this.emit('chuyen',{zone,inst:zone.startsWith('inst_')})}
 tick(){
  const now=Date.now();this.state.now=now;
  this.intro?.tick(now);this.inventory?.tick(now);this.combat?.tick(now);
  if(!this.intro?.active&&this.player.hp<=0&&!this.wasDead){this.wasDead=true;this.player.trongThuong=true;this.emit('nga',{giay:5,inst:this.zoneId.startsWith('inst_')});}
  if(this.cultivating&&(this.absorbing||this.autoCultivate)&&this.profile.nguyenThach>=1){
   if(now-(this.lastCultivate||0)>=1500){this.lastCultivate=now;this.profile.nguyenThach--;this.progress.cultivationStones=(this.progress.cultivationStones||0)+1;this.progress.training=Math.min(100,this.progress.training+4);this.profile.tv.diem=this.progress.training;this.player.cn=Math.min(this.player.cnMax,this.player.cn+20);this.profile.dotPha={...this.profile.dotPha,mo:true,day:this.progress.training>=100};this.refresh();this.cultivationMini();}
  }else if(!this.cultivating&&this.absorbing&&this.profile.nguyenThach>0&&this.player.cn<this.player.cnMax){this.player.cn=Math.min(this.player.cnMax,this.player.cn+8);this.profile.nguyenThach=Math.max(0,this.profile.nguyenThach-.25);this.refresh()}
  if(this.meditating){this.progress.training=Math.min(100,this.progress.training+1);this.player.hp=Math.min(this.player.hpMax,this.player.hp+2);this.player.cn=Math.min(this.player.cnMax,this.player.cn+3);this.refresh()}
  this.onStateChange.emit(this.state);if(now-this.lastSave>4000)this.save();
 }
}
let tools;
function showTools(){if(tools)return;tools=document.createElement('aside');tools.id='independent-tools';tools.innerHTML=`<style>#independent-tools{position:fixed;right:12px;top:100px;z-index:10000;color:#372717;font:14px Philosopher,serif;max-width:min(290px,90vw)}#independent-tools summary{cursor:pointer;background:#f4e5b7;border:1px solid #725430;border-radius:6px;padding:9px 13px;box-shadow:0 3px 12px #0006}#independent-tools details[open]{background:#f7eccf;border:1px solid #836039;border-radius:7px;padding:10px;box-shadow:0 6px 24px #0007}#independent-tools button,#independent-tools select{font:inherit;padding:7px;margin:4px 2px;border:1px solid #92704b;background:#fff9e9;color:#372717;border-radius:4px;cursor:pointer}#independent-tools small{display:block;line-height:1.5}#independent-tools p{margin:8px 0}#independent-tools select{max-width:250px}@media(max-width:600px){#independent-tools{top:115px;right:6px;font-size:12px}}</style><details><summary>☯ Hành trình · Bản độc lập</summary><p data-independent-stats></p><button data-game="gather">Hái linh thảo</button><button data-game="meditate">Vận khí / Dừng</button><button data-game="breakthrough">Đột phá</button><button data-game="reward">Nhận thưởng</button><button data-game="heal">Hồi phục</button><p><label>Đi đến vùng <select aria-label="Đi đến vùng" data-travel></select></label></p><button data-game="travel">Khởi hành →</button><button data-game="save">Lưu ngay</button><button data-game="export">Tải bản lưu</button><small>WASD di chuyển · Click đánh · 1–7 dùng cổ · F tương tác · X vận khí · B túi đồ · C nhân vật · M bản đồ.<br>Chơi đơn • Lưu trên trình duyệt • Không kết nối server gốc.</small><small data-save-status></small></details>`;document.body.append(tools);
 const zones=Object.keys(current.data.zones).filter(id=>id.startsWith('zone_')).sort((a,b)=>a==='zone_ta_gia_trai'?-1:b==='zone_ta_gia_trai'?1:a.localeCompare(b));
 const select=tools.querySelector('select');for(const id of zones){const o=document.createElement('option');o.value=id;o.textContent=current.label(current.data.zones[id].ten_key,id);select.append(o)}
 const extras=document.createElement('div');
 for(const [key,text] of [['intro-assist','Theo hướng dẫn / Tiếp thoại'],['shop','Cửa hàng'],['craft','Cổ phương'],['training','Tu luyện'],['replay','Chơi lại mở đầu']]){const b=document.createElement('button');b.dataset.extra=key;b.textContent=text;extras.append(b)}
 const audit=document.createElement('a');audit.href='/reconstruction/';audit.target='_blank';audit.rel='noopener';audit.textContent='Xem phạm vi khôi phục và phần còn thiếu →';extras.append(audit);tools.querySelector('details').append(extras);
 tools.addEventListener('click',e=>{const a=e.target.closest('[data-extra]')?.dataset.extra;if(!a)return;
  if(a==='intro-assist')current.intro?.assist();
  else if(a==='replay'){current.progress.intro={step:'opening',done:false};current.save();current.travel('inst_mo_dau');}
  else if(current.intro?.active)current.notify('Hoàn thành Giấc mơ trước khi dùng chức năng ở trại.');
  else if(a==='shop')current.inventory.handle('cua_hang',{});
  else if(a==='craft')current.inventory.handle('che_tao',{});
  else if(a==='training')current.startCultivation();
 });
 tools.addEventListener('click',e=>{const a=e.target.closest('[data-game]')?.dataset.game;if(!a||!current)return;if(a==='gather')current.gather();if(a==='meditate')current.send('ngoi');if(a==='breakthrough')current.breakthrough();if(a==='reward')current.reward();if(a==='heal'){current.player.hp=current.player.hpMax;current.player.cn=current.player.cnMax;current.refresh();current.notify('Đã hồi phục.')}if(a==='travel'){tools.querySelector('details').open=false;current.travel(select.value)}if(a==='save'){if(current.save())current.notify('Đã lưu tiến trình trên trình duyệt.')}if(a==='export'){current.save();const url=URL.createObjectURL(new Blob([localStorage.getItem(current.key)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='co-tien-lo-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}});
 updateTools();
}
function updateTools(){
 if(!tools||!current)return;const r=current,dream=!!r.intro?.active;
 tools.querySelector('summary').textContent=dream?'☯ Giấc mơ · Hướng dẫn':'☯ Hành trình · Bản độc lập';
 tools.querySelector('[data-independent-stats]').textContent=dream?`Giấc mơ · ${r.intro.stage}\nLàm theo lời Tri Thu và ô cổ đang sáng. Giữ nguyên tiến trình ở trại khi xem lại.`:`${r.player.ten} · Chuyển ${r.profile.chuyen||1} · ${Math.floor(r.profile.nguyenThach||0)} nguyên thạch\nSăn thú ${r.progress.kills} · Linh thảo ${r.progress.herbs} · Tu vi ${Math.floor(r.progress.training)}/100`;
 for(const b of tools.querySelectorAll('[data-game]'))b.disabled=dream&&!['save','export'].includes(b.dataset.game);
 tools.querySelector('select').disabled=dream;
 for(const b of tools.querySelectorAll('[data-extra]')){const a=b.dataset.extra;b.hidden=(a==='intro-assist'&&!dream)||(a==='replay'&&dream);b.disabled=dream&&a!=='intro-assist';}
 tools.querySelector('[data-save-status]').textContent=r.lastSave?'✓ Đã lưu lúc '+new Date(r.lastSave).toLocaleTimeString('vi-VN'):'';
}
window.addEventListener('pagehide',()=>current?.save());
window.CTLGame={get room(){return current}};
