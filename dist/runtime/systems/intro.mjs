/**
 * Intro reconstruction. Map/Gu/guide wording are public client data; initial
 * narration, profile and actors were observed in a new guest session 22 Oct.
 * Progression triggers and timing below are independent rules, not server code.
 */
const KE=text=>({loai:'thoai',vai:'ke',text});
const TRI=text=>({loai:'thoai',vai:'npc',npc:'npc_tri_thu',ten:'Tri Thu',text});
const activeSlots=['gu_ngu_khieu_hoa_thap','gu_hoa_long','gu_viem_tru','gu_lieu_quang','gu_dien_nhan','gu_viem_duc'];
const passives=['gu_hoa_diem_phi_phong','gu_viem_tam','gu_hoa_mao_tam_truong','gu_hoa_y'];
const guides={move:'di_chuyen',dash:'luot',fly:'bay',arena:'ra_san_da',attack:'bai_cong',guard:'bai_thu',heal:'bai_tri',scout:'bai_trinh',free:'bai_tu_do',absorb:'hap_thu',ultimate:'sat_chieu',enrage:'ne',self:'tu_bao'};
const targets={move:{x:16.5,y:38},dash:{x:10,y:17},fly:{x:28,y:16},arena:{x:34,y:16}};
export function createIntro(room){
 if(room.zoneId!=='inst_mo_dau'||room.progress.intro?.done)return null;
 const baseProfile=structuredClone(room.profile);
 const state=room.progress.intro??={step:'opening',done:false};
 state.step ||= 'opening';
 let queue=[],after=null,started=false,dialogOpen=false,held=false,charge=0,freeHits=0,enrageHits=0,dodged=false,choosing=false;
 let next=Date.now()+2000, last=Date.now();
 const raw=room.data;
 room.data={...raw,gu:{...raw.gu,...Object.fromEntries(Object.entries(raw.guGiacMo||{}).map(([id,d])=>[id,{...raw.gu[id],...d}]))}};
 const h=room.profile,p=room.player;
 h.chuyen=5;h.tv={chuyen:5,giai:0,diem:0,can:100};h.gm=false;
 h.o=activeSlots.map(loai=>{const d=room.data.gu[loai]||{};return{uid:'@'+loai,loai,cd:0,cdMax:(d.hoi_chieu||0)*1000,cn:(d.cn||0)*(d.cn_theo==='ti_le_toi_da'?2400:1),cnGiay:d.kich_hoat==='duy_tri',bat:false}});
 h.obd=passives.map(id=>'@'+id);h.opt=[];h.soO=6;h.soOPhuTro=0;h.satChieu=['km_hoa_giao_lieu_nguyen'];h.satChieuO=['km_hoa_giao_lieu_nguyen',null];h.nguyenThach=Math.max(5000,h.nguyenThach||0);h.nt=h.nguyenThach;
 Object.assign(p,{hp:5200,hpMax:5200,cn:2400,cnMax:2400,chuyen:5,tocDo:1.2,canh:'',banMenh:'gu_ngu_khieu_hoa_thap'});
 room.state.actors.clear();
 const tri={id:'intro-tri-thu',loai:'dong_hanh',def:'npc_tri_thu',hinh:'npc_tri_thu_mo_dau',ten:'Tri Thu',x:p.x+2,y:p.y-.5,huong:4,hp:3600,hpMax:3600,dong:'',dongSeq:0,bac:'',chuyen:4,hieuUng:'',tuongTac:false,co:1,nhuom:0,nham:''};
 const boss={id:'intro-thien-thi',loai:'thu',def:'beast_tsa_thien_thi',hinh:'beast_mo_dau_thien_thi_vuong',ten:'???',x:50,y:9.5,sx:50,sy:9.5,huong:6,hp:45000,hpMax:45000,dong:'idle',dongSeq:0,bac:'thien_vuong',chuyen:5,hieuUng:'',tuongTac:false,co:1.35,nhuom:0,nham:'',introBoss:true};
 room.state.actors.set(tri.id,tri);room.state.actors.set(boss.id,boss);
 function guide(){
  const key=guides[state.step];if(!key)return;
  const text=room.label('ui.huong_dan.'+key+(room.options.cham&&room.text['ui.huong_dan.'+key+'_cham']?'_cham':''));
  const o={fly:5,attack:1,guard:2,heal:3,scout:4}[state.step];
  room.emit('huong_dan',{text,...targets[state.step]?{dich:targets[state.step]}:{},...o!==undefined?{o}:{}});
  room.emit('nv',{ds:[{id:'mq_mo_dau',ten:'Giấc mơ',chinh:true,muc:'Ra khỏi lầu đá cùng Tri Thu.',...targets[state.step]?{zone:'inst_mo_dau',dich:targets[state.step]}:{}}],xong:0,kyUc:[]});
 }
 function setStep(step){state.step=step;room.emit('huong_dan',null);room.emit('mini',null);guide();room.refresh();room.save()}
 function speak(lines,done){queue=lines.slice();after=done;dialogOpen=true;room.emit('huong_dan',null);room.emit('thoai',queue.shift());}
 function advanceDialog(){if(queue.length){room.emit('thoai',queue.shift());return}room.emit('thoai',null);dialogOpen=false;const fn=after;after=null;fn?.();}
 function begin(){if(started)return;started=true;
  room.emit('nv',{ds:[{id:'mq_mo_dau',ten:'Giấc mơ',chinh:true,muc:'Ra khỏi lầu đá cùng Tri Thu.'}],xong:0,kyUc:[]});
  if(state.step==='opening')speak([KE('Giấc mơ ấy lại tới.'),KE('Một lầu đá cao không thấy đỉnh, gió lùa qua mái vỡ, mang theo bụi đá.\nBên cạnh ngươi là Tri Thu, đã lớn, áo lụa xanh.'),TRI('Huynh, đi sát muội. Lầu này lạ lắm.')],()=>setStep('move'));
  else if(state.step==='collapse')collapse();
  else if(state.step==='confront')confront();
  else if(state.step==='overpower')overpower();
  else if(state.step==='choice')choice();
  else if(state.step==='ending')ending();
  else guide();
 }
 function collapse(){state.step='collapse';speak([KE('Trên sàn lóe lên một vòng ký hiệu.\nTrần đá trên cửa đông sập xuống, chắn kín lối ra.'),TRI('Vòng ký hiệu vừa sáng là trần sập. Lầu này không muốn ai ra.'),{loai:'thoai',vai:'nc',ten:p.ten,text:'Bên trái còn lối.'}],()=>setStep('dash'));}
 function confront(){state.step='confront';if(h.o[5]?.bat)room.combat?.attack({o:5});p.canh='';room.changed(p);boss.x=42;boss.y=16;room.changed(boss);
  speak([KE('Lối bên trái dẫn ra một sân đá rộng. Gió lùa qua, mang theo mùi tanh còn mới.'),KE('Giữa sân, bốn người nằm im, xếp thẳng một hàng như có ai cố ý bày ra.'),KE('Trên bậc đá phía bắc, một bóng sáu tay đứng quay lưng, da xám như xác.'),KE('Nó không nhìn hai người. Nó đứng như đang đợi một ai khác.'),TRI('Huynh cẩn thận… thứ đó có gì không ổn. Muội ở ngay sau lưng, che cho huynh.')],()=>{p.x=35;p.y=16;room.teleport(p.x,p.y);setStep('attack')});
 }
 function finish(){
  state.done=true;state.step='done';room.profile=structuredClone(baseProfile);room.profile.xong??=[];if(!room.profile.xong.includes('mq_mo_dau'))room.profile.xong.push('mq_mo_dau');
  room.profile.flags??=[];for(const f of ['intro_complete','flag_mo_dau_xong','flag_mq_mo_dau_xong',...(state.choice===0?['flag_mo_dau_khong_di_mot_minh']:[])])if(!room.profile.flags.includes(f))room.profile.flags.push(f);
  Object.assign(p,{hp:baseProfile.hp??baseProfile.hpMax??300,hpMax:baseProfile.hpMax??300,cn:baseProfile.cn??0,cnMax:baseProfile.cnMax??0,chuyen:baseProfile.chuyen??0,tocDo:1,canh:'',banMenh:''});
  room.progress.pendingSpawn={zone:'zone_ta_gia_trai',x:12,y:40};
  room.emit('thoai',null);room.emit('mini',null);room.emit('huong_dan',null);room.refresh();room.save();room.travel('zone_ta_gia_trai');
 }
 function choice(){state.step='choice';choosing=true;dialogOpen=false;room.emit('thoai',{loai:'lua_chon',cac:[{i:0,text:'Ta không đi một mình.'},{i:1,text:'Muội lùi lại.'},{i:2,text:'(Nắm tay muội, không nói gì.)'}]});room.save();}
 function overpower(){state.step='overpower';p.hp=Math.min(p.hp,624);p.cn=Math.min(p.cn,1);room.refresh();speak([KE('Một đòn giáng xuống cả sân. Hai người văng ra, gục giữa đá vụn.'),KE('Tri Thu gượng dậy, đứng chắn trước mặt ngươi.'),TRI('Muội còn chặn được một đòn. Huynh chạy đi.')],choice);}
 function forest(){
  h.o=h.o.map(s=>({...s,bat:false}));p.canh='';
  room.removeActor?.(tri.id);room.removeActor?.(boss.id);
  for(let j=0;j<24;j++){const angle=j*2.39996,r=j?2+Math.sqrt(j)*1.6:0;
   const a={id:'dream-tree-'+j,loai:'vat',def:'cay_mo_dau',hinh:j?'prop_cay_tan_2':'prop_cay_non',ten:'',x:tri.x+Math.cos(angle)*r,y:tri.y+Math.sin(angle)*r,huong:2,hp:1,hpMax:1,dong:'',dongSeq:0,bac:'',chuyen:0,hieuUng:'',tuongTac:false,co:j?1.05:1,nhuom:0,nham:''};
   if(room.addActor)room.addActor(a);else room.state.actors.set(a.id,a);
  }
  room.emit('fx',{k:'anh_xanh',x:tri.x,y:tri.y});
 }
 function ending(){state.step='ending';forest();speak([KE('Khiếu ngươi mới nóng được một nửa.\nTrước mặt ngươi, một khiếu khác đã vỡ.'),KE('Ánh xanh tràn khắp sân đá. Rễ cây xé nền đá trồi lên, thân cây mọc vút, tán lá che kín trời.'),{...KE('Chỗ Tri Thu vừa đứng, chỉ còn một cây non.'),tranh:'tranh_md_4_bung_sang'},KE('Rừng nuốt trọn cả sân đá, nuốt luôn cái bóng sáu tay.'),{loai:'thoai',vai:'nc',ten:p.ten,text:'MUỘI MUỘI!'},{loai:'thoai',vai:'nc',ten:p.ten,text:'TRI THU!'},KE('Rồi ngươi tỉnh dậy.')],finish);}
 function handle(type,args={}){
  if(state.done)return false;
  if(type==='thoai'&&choosing){if(!Number.isInteger(args.chon)||args.chon<0||args.chon>2)return true;state.choice=args.chon;choosing=false;room.emit('thoai',null);charge=0;setStep('self');room.emit('mini',{loai:'tu_bao',thanh:0,dung:.5});return true}
  if(type==='thoai'&&dialogOpen){advanceDialog();return true}
  if(type==='hap'){held=!!args.giu;if(held)p.dong='absorb';else p.dong='idle';room.changed(p);return true}
  if(type==='mini'&&state.step==='self'){held=!!args.giu;return true}
  if(type==='dung'&&args.o===4&&state.step==='scout'){
   const slot=h.o[4],now=Date.now();if(now<(slot.cd||0)||p.cn<18)return true;
   p.cn-=18;slot.cd=now+3000;slot.bat=true;boss.hieuUng='';room.changed(boss);
   room.emit('fx',{k:'duy_tri',id:room.sessionId,gu:'gu_dien_nhan',bat:true});setStep('free');return true;
  }
  if(type==='sat_chieu'){
   if(state.step!=='ultimate'){room.notify(room.label('ui.huong_dan.sat_chieu_chua'));return true}
   if(p.cn<p.cnMax*.8){setStep('absorb');return true}
   p.cn-=p.cnMax*.7;boss.hp=Math.max(1,boss.hp-12000);room.changed(boss);room.emit('fx',{k:'sat_chieu',id:room.sessionId,km:'km_hoa_giao_lieu_nguyen',x:boss.x,y:boss.y});
   speak([KE('Sát chiêu trúng ngực nó. Nó khựng lại, rồi chậm rãi ngẩng đầu.'),KE('Sáu cánh tay quét loạn khắp sân.'),TRI('Đừng đỡ! Lướt ra!')],()=>setStep('enrage'));room.refresh();return true;
  }
  if(type==='roi'){finish();return true}
  return false;
 }
 function onAction(type,args,result){
  if(state.done||dialogOpen)return;
  if(type==='in'){
   if(state.step==='enrage'&&args.luot){dodged=true;if(enrageHits>=2)overpower();}
   if(state.step==='move'&&Math.hypot(p.x-16.5,p.y-38)<2.3)collapse();
   else if(state.step==='dash'&&p.y<21)setStep('fly');
   else if(state.step==='fly'&&p.x>27&&p.y<21)setStep('arena');
   else if(state.step==='arena'&&p.x>32&&p.y<22)confront();
   return;
  }
  if(type!=='dung'||!result?.ok)return;
  if(state.step==='enrage'){if(++enrageHits>=2&&dodged)overpower();return}
  const o=args.o;
  if(state.step==='fly'&&o===5){p.canh='gu_viem_duc';room.changed(p)}
  if(state.step==='attack'&&o===1){setStep('guard');room.emit('fx',{k:'canh_bao',id:boss.id,x:p.x,y:p.y,ms:2500,r:3});}
  else if(state.step==='guard'&&o===2){p.hp=Math.max(1,p.hp-1100);tri.hp=1800;room.changed(tri);room.refresh();setStep('heal')}
  else if(state.step==='heal'&&o===3){setStep('scout');boss.hieuUng='an';room.changed(boss)}
  else if(state.step==='scout'&&o===4){boss.hieuUng='';room.changed(boss);setStep('free')}
  else if(state.step==='free'&&(o==='tay'||o===0||o===1)){if(++freeHits>=3){p.cn=Math.min(180,p.cn);room.refresh();setStep('absorb')}}
 }
 function tick(now){
  if(state.done)return;
  const elapsed=Math.min(1,Math.max(0,(now-last)/1000));last=now;
  if(!started){if(now>=next)begin();return}
  if(dialogOpen)return;
  const d=Math.hypot(p.x-tri.x,p.y-tri.y);if(d>2){tri.x+=(p.x-tri.x)/d*elapsed*5;tri.y+=(p.y-tri.y)/d*elapsed*5;tri.dong='walk';room.changed(tri)}
  if(held&&state.step==='absorb'){p.cn=Math.min(p.cnMax,p.cn+elapsed*480);room.refresh();if(p.cn>=p.cnMax*.98){held=false;setStep('ultimate')}}
  if(state.step==='self'&&held){charge=Math.min(.5,charge+elapsed/6);room.emit('mini',{loai:'tu_bao',thanh:charge,dung:.5});if(charge>=.5){held=false;room.emit('mini',null);ending()}}
  if(boss.hp<=0){boss.hp=1;boss.respawn=0;room.changed(boss)}
  if(p.hp<=0){p.hp=p.hpMax;room.refresh()}
 }
 function assist(){
  if(dialogOpen){advanceDialog();return}
  const point=targets[state.step];if(point){room.teleport(point.x,point.y);onAction('in',{},null);return}
  room.notify('Hãy dùng ô cổ được tô sáng hoặc giữ R theo lời hướng dẫn. Có thể mở Hướng dẫn để xem phím.');
 }
 return {get active(){return !state.done},get stage(){return state.step},baseProfile,begin,handle,onAction,tick,assist,finish};
}
