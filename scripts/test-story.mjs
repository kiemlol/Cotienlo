import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createMortalProfile} from '../src/profile-defaults.mjs';
import {createStory} from '../src/systems/story.mjs';
import {MAIN_QUESTS,SIDE_QUESTS} from '../src/systems/story-data.mjs';
const data=JSON.parse(await readFile('dist/data/game.json')),text=JSON.parse(await readFile('dist/data/text_vi.json'));
function fixture(saved){
 const room={data,text,profile:createMortalProfile('Kiểm tra'),progress:saved?structuredClone(saved):{intro:{done:true}},zoneId:'zone_ta_gia_trai',
  player:{ten:'Kiểm tra',hp:300,hpMax:300,cn:0,cnMax:0,x:12,y:40},state:{actors:new Map()},messages:[],saves:0,
  label(k,f){return text[k]||f||k},emit(type,p){this.messages.push({type,p})},notify(t){this.emit('tb',{text:t})},refresh(){},save(){this.saves++},changed(){},
  addActor(a){this.state.actors.set(a.id,a)},travel(id){this.destination=id},startCultivation(){this.training=true},
  inventory:{handle(){return true}},progression:{handle(){return true},learn(){},openCrafting(){return true}}};
 room.story=createStory(room);room.story.begin();return room;
}
function choose(r,choice){r.story.handle('thoai',{chon:choice})}
function advance(r){for(let i=0;i<10;i++){const d=r.progress.story.dialogue;if(!d||d.nodes[d.index]?.loai==='lua_chon')return;r.story.handle('thoai',{})}throw Error('dialogue did not finish')}
function main(r){r.story.interact(r.story.currentQuest.npc);choose(r,'story')}
for(const q of SIDE_QUESTS)assert(data.item[q.item],q.item);
const r=fixture();assert(r.story.activeScene);r.story.handle('canh_dung_xong',{id:'bogus'});assert(r.story.activeScene);
r.story.handle('canh_dung_xong',{id:'canh_x01_tinh_day'});assert(!r.story.activeScene);
advance(r);choose(r,'unknown');assert.equal(r.profile.nguyenThach,0);choose(r,1);
const resumed=fixture(structuredClone(r.progress));assert(resumed.progress.story.dialogue);assert.equal(resumed.progress.story.choices.wake,1);
advance(r);assert.equal(r.progress.story.step,'wine');r.story.interact('cua_ham_ruou');assert.equal(r.progress.story.step,'carry');main(r);advance(r);assert.equal(r.story.currentQuest.id,'mq_x02');assert.equal(r.profile.nguyenThach,40);
main(r);advance(r);assert.equal(r.destination,'inst_khai_khieu');
r.profile.chuyen=1;r.profile.tv={chuyen:1,giai:0,diem:0,can:300};r.story.onEvent('awakening');assert.equal(r.story.currentQuest.id,'mq_x03');
main(r);choose(r,'gu_nguyet_quang');advance(r);assert.equal(r.profile.co.length,1);
main(r);advance(r);assert.equal(r.story.currentQuest.id,'mq_x03');
r.profile.co[0].luyenHoa=true;r.profile.o[0]={uid:r.profile.co[0].uid,loai:r.profile.co[0].loai};r.story.onEvent('equip');assert.equal(r.story.currentQuest.id,'mq_x04');
main(r);advance(r);assert([...r.state.actors.values()].some(a=>a.storyDummy));Object.assign(r.player,{x:54,y:40});
for(let i=0;i<3;i++)r.story.onAction('dung',{o:0},{ok:true});r.story.onAction('in',{luot:true});main(r);advance(r);
assert.equal(r.story.currentQuest.id,'mq_x05');main(r);advance(r);assert(r.training);
r.story.onEvent('tu_luyen',{stones:5});main(r);assert.equal(r.story.currentQuest.id,'mq_x06');
r.story.onEvent('instance_complete',{zone:'inst_thi_luyen_ba_cua'});assert.equal(r.story.currentQuest.id,'mq_x07');
main(r);advance(r);for(let i=0;i<5;i++)r.story.onKill({hp:0});main(r);assert.equal(r.story.currentQuest.id,'mq_x08');
main(r);advance(r);assert.equal(r.destination,'inst_ham_ruou');assert.equal(r.progress.story.quests.mq_x08.step,4);
r.story.onEvent('cellar-wall');main(r);assert.equal(r.story.currentQuest.id,'mq_x09');
main(r);choose(r,'promise');advance(r);assert.equal(r.progress.story.relations.npc_tri_thu,3);assert(r.profile.flags.includes('local_sister_promise'));
assert.equal(r.story.currentQuest.id,'mq_x10');r.profile.tui.item_thao_duoc=3;r.story.onEvent('nghe_che',{id:'duong_co'});main(r);
assert.equal(r.story.currentQuest.id,'mq_x11');r.profile.tv.giai=3;main(r);assert.equal(r.profile.tui.item_nguyen_tuyen_lang,1);assert(r.story.gates.breakthrough);
const money=r.profile.nguyenThach;choose(r,'story');assert.equal(r.profile.nguyenThach,money);
r.profile.chuyen=2;r.progress.story.visited.push('zone_ben_thuong');r.story.onEvent('instance_complete',{zone:'inst_hang_heo'});main(r);assert.equal(r.story.currentQuest,undefined);assert.equal(r.progress.story.rewards.filter(id=>id==='mq_x11').length,1);
for(const choice of ['protect','silent']){const x=fixture();x.story.finishWake();advance(x);choose(x,0);advance(x);x.progress.story.chapter=8;main(x);choose(x,choice);advance(x);assert.equal(x.progress.story.choices.sister,choice);assert.notEqual(x.progress.story.relations.npc_tri_thu,3)}
const side=fixture();side.story.finishWake();advance(side);choose(side,2);advance(side);side.story.interact('npc_ta_ninh');choose(side,'side:local_duoc');advance(side);assert.equal(side.progress.story.sides.local_duoc,'active');side.profile.tui.item_thao_duoc=4;side.story.interact('npc_ta_ninh');choose(side,'side:local_duoc');advance(side);assert.equal(side.profile.tui.item_thao_duoc,4);side.profile.tui.item_thao_duoc=5;side.story.interact('npc_ta_ninh');choose(side,'side:local_duoc');advance(side);assert.equal(side.profile.tui.item_thao_duoc,0);assert.equal(side.profile.nguyenThach,35);side.story.interact('npc_ta_ninh');choose(side,'side:local_duoc');assert.equal(side.profile.nguyenThach,35);
console.log('Story PASS: all '+MAIN_QUESTS.length+' reconstructed checkpoints, eight valid side jobs, real event gates, dialogue resume, three sister branches, no duplicate or premature rewards.');
