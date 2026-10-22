import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {cp,copyFile,mkdir,mkdtemp,readFile,readdir,rm,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename,join} from 'node:path';

const project='/workspace/sites/cotienlo-game';
const research='/workspace/work/cotienlo-expand';
const researchV3=research+'/v3';
const output=project+'/dist/reconstruction';
const reports=project+'/reports';

const featureUpdates={
 world:'Giữ 55 map, điểm/cửa và nhóm sinh theo catalog. Encounter sở hữu roster, điều kiện và reset; các map truyện chưa có script được để yên, không sinh quái giả.',
 movement:'Di chuyển, va chạm, chạy nhanh 30 thể lực, lướt 4 m/0,2 giây và chặn khi trói/choáng/chết hoạt động cục bộ. Không có đồng bộ nhiều người.',
 navigation:'Ghi nhận trạm đã ghé; xe chỉ đi giữa trạm thế giới đã mở, phải đứng gần trạm và dùng phí cục bộ 5 nguyên thạch. Tự tìm đường server chưa có.',
 combat:'266/377 Cổ được executor nhận: 248 không báo thiếu effect trong phạm vi executor và 18 xử lý một phần; 111 không khả dụng qua executor. Có AoE, hồi máu, khiên, DoT, khống chế, phản sát thương, ẩn/phát hiện, biến thân và bảo mệnh; công thức server, nhiều sát chiêu/địa lợi/nô thú vẫn thiếu.',
 status:'HP/CN/thể lực, khiên, độc, thiêu đốt, mù, phong khiếu, băng, trói/choáng, trọng thương và hồi sinh Cổ Nhất–Tam chuyển có luật chơi đơn. Chi phí cứu Cổ và một số tương tác hiệu ứng là policy cục bộ.',
 cultivation:'Tu luyện dùng bảng tu vi Nhất–Ngũ chuyển công bố, quá tải khiếu, Tửu Trùng, ngắt khi di chuyển/bị đánh và bế quan có giới hạn. Ngoài phòng tu luyện dùng hệ số cục bộ 75%.',
 breakthrough:'Có điều kiện nhiệm vụ, tài nguyên/CN, ba nhịp giữ–thả, phí thử lại và Xá Lợi đúng chuyển. Cửa sổ nhịp và phí chưa được xác nhận từ backend gốc.',
 offline:'Bế quan tính từ mốc save, bị chặn trước khi nhiệm vụ mở khóa và giới hạn giờ. Không mô phỏng săn treo máy hay tổng kết server.',
 profile:'Nhân vật mới bắt đầu Phàm nhân 300 HP/0 CN; chỉ số cảnh giới, Cổ bị động, hộ cụ, bộ và đồ đeo cập nhật thật, idempotent. Save cũ được giữ nguyên.',
 gu:'Có lắp/tháo, cho ăn, lịch đói offline, luyện hóa kim giữ–thả, ô dưỡng Cổ, hợp luyện và tử vong/hồi sinh. Hệ số không công bố và các Cổ tiện ích đặc thù chưa đầy đủ.',
 gu_mastery:'Thuần thục tăng khi Cổ đánh trúng mục tiêu thật và khi luyện sân; có mốc bậc công bố. Nâng sao/tẩy thuộc tính chưa được dựng.',
 birth_gu:'Giữ quy tắc bảo vệ Cổ bản mệnh và cộng hưởng trong chiến đấu. Đổi bản mệnh/mảnh trao đổi đầy đủ vẫn chưa có.',
 recipes:'70 công thức công bố được đọc từ catalog; hợp luyện tiêu nguyên liệu thật, chạy theo thời gian và giữ Cổ chính khi thất bại. Xác suất chưa công bố là policy cục bộ.',
 inventory:'Túi, tiêu hao, mua/bán, giới hạn sức chứa và chuyển hòm hoạt động bằng tài nguyên thật. Một số loại vật phẩm đặc biệt vẫn chỉ hiển thị.',
 equipment:'Bốn ô hộ cụ, bộ 2/4, cấp/phẩm, nạp, bảo hiểm, bùa, khảm/gỡ/ghép đá và đồ đeo đã có. Hệ số nâng cấp/bộ/đá là luật tự dựng khi wiki không nêu số.',
 appearance:'Chân dung, tranh nhân vật, giới tính/áo và đồ đeo đã nối với client. Kho mỹ phẩm, danh hiệu và riêng tư server chưa có.',
 npc_shop:'Kho tộc, thuốc và quầy NPC dùng catalog/giới hạn công bố; mua bán nguyên tử. Tạ Ninh/Tú Nương tạm dùng catalog vật liệu Thương hội vì chưa quan sát được quầy riêng.',
 storage:'Hòm đồ dùng đúng giao diện hom_do của client, kiểm tra đứng gần thủ kho, gửi/rút/nâng ô nguyên tử và lưu được. Giá 50×mốc, 20 ô đầu và trần 60 là policy cục bộ; kho bang chưa có.',
 professions:'Có 8 nghề, học khi làm, hai nghề chính, điểm/bậc, đổi/thôi nghề, nghề phụ và công thức/vị trí theo wiki. Mốc 25/50/75 và mất nửa điểm khi thôi là policy cục bộ.',
 gathering:'Nút nhận nguyên liệu miễn phí đã bỏ; các công thức tiêu vật liệu thật và một số nhiệm vụ giao nộp có kiểm đếm. Node tài nguyên, cạn kiệt và minigame thu thập từng nghề chưa đầy đủ.',
 quests:'Có 12 checkpoint chính, 8 việc phụ, mục tiêu/cờ/quan hệ/phần thưởng một lần và sổ nhiệm vụ. Chỉ Sáng xuân, việc xuống hầm/khiêng rượu được quan sát trực tiếp; phần truyện sau đó là tuyến chơi đơn tự dựng.',
 dialogue:'Cảnh Sáng xuân dùng 13 lệnh quan sát và renderer gốc; hội thoại Tri Thu/mẹ cùng 3 lựa chọn được nối. Chỉ nhánh tỉnh dậy số 1 đã quan sát; nhánh 0/2 và các cây thoại về sau là tự viết.',
 encounters:'Roster/điều kiện/sự kiện cục bộ thay cho quái mẫu; có khai khiếu, ba cửa, hầm rượu, boss theo giờ, đột biến và script pha/cảnh báo. Chưa có mọi script private của 55 map.',
 dream_rules:'Giấc mơ mở đầu đầy đủ tuyến chính đã quan sát, lựa chọn, tự bạo, cảnh rừng và chuyển sang Sáng xuân. Timing/nhánh chưa quan sát vẫn là reconstruction.',
 dungeons:'10 map phụ bản có wave cục bộ; 7 ID/drop được đối chiếu nguồn công bố, boss có pha/cảnh báo và chống nhận loot lặp. Không có party/backend và chưa khẳng định đúng toàn bộ script gốc.',
 trial_tower:'Có tầng, đồng hồ, boss mỗi tầng thứ năm, thất bại/reset và sổ nhận thưởng ngày trong save. AI/hệ số/phần thưởng chưa công bố là luật cục bộ.',
 heritage_tower:'Có ba tầng, chủ đề tuần, checkpoint và chống nhận lại thưởng. Chưa có toàn bộ sách/trao đổi và script server.',
 world_boss:'Có cửa sổ giờ công bố, cảnh báo, pha và loot cục bộ. Không có đóng góp/xếp hạng/chia thưởng nhiều người.',
 save:'Save schema v3 vẫn dùng khóa ctl.playable.v1.*, có migration bảo toàn save V1/V2, vị trí, quest, dịch vụ và export. Đây là save trình duyệt, không phải cloud account.',
};

const matrix=JSON.parse(await readFile(reports+'/feature-matrix.snapshot.json','utf8'));
for(const feature of matrix.features){
  if(!featureUpdates[feature.id])continue;
  feature.clone_status='partial_local';
  feature.clone_support_and_gaps=featureUpdates[feature.id];
  feature.evidence_basis='Static recovered client/public catalog plus focused unit and browser QA; original backend remains unavailable.';
}
matrix.clone_snapshot_utc=new Date().toISOString();
matrix.scope.mode='Public-client reconstruction plus independently implemented local gameplay V3';
matrix.scope.execution='Original public game observed with a separate guest for the bounded Sáng xuân flow; clone covered by eight automated suites and desktop/touch browser QA.';
matrix.post_audit_integration={
  version:'3.0.0',date:'2026-10-22',
  observed_scope:'Opening dream, 13-step Sáng xuân cutscene, wake dialogue choice 1, and cellar/carry-wine quest transition.',
  independent_scope:'Later quests, side jobs, professions, equipment policies, advanced progression, combat extensions and local encounter scripts.',
  public_client_recovery:{main:'ev_f575ceb894d2ec9eaf56cc01ef3b631348fbe1052903631c27dd9f03b65b2580',chunks:'ev_02b5a3106773bfd085cf1d0c1a3620991fa821c83dc1c05253d7d9477d3608f2'},
  semantic_analysis:{evidence_id:'ev_ad4c36a8bdd518b4ac64aaab4fff9fcf6d11f1597c0ca022153c520821e6a004',coverage:'Partial: main bundle exhausted a 3072 MiB heap; three chunks parsed. Readable recovery is not proof of backend or complete semantics.'},
  testing:{node_suites:8,desktop:'Full observed opening once; focused V3 wake-to-first-Gu/refining/equipment/profession/reload path passed.',touch:'844×390 storage, equipment, professions, responsive report and download passed with no page/HTTP errors.'},
  updated_feature_rows:Object.keys(featureUpdates),
};
await writeFile(output+'/feature-matrix.json',JSON.stringify(matrix,null,2)+'\n');

const rawEvents=JSON.parse(await readFile(researchV3+'/observed-wake-session.json','utf8'));
const sceneAt=rawEvents.findIndex(event=>event.type==='canh_dung'&&event.payload?.id==='canh_x01_tinh_day');
if(sceneAt<0)throw new Error('Missing observed Sáng xuân scene');
const observedGuestName=rawEvents.find(event=>event.type==='thoai'&&event.payload?.vai==='nc'&&event.payload?.ten)?.payload.ten;
const clean=value=>{
  if(typeof value==='string')return observedGuestName?value.replaceAll(observedGuestName,'{{ten}}'):value;
  if(Array.isArray(value))return value.map(clean);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,clean(item)]));
  return value;
};
const allowedDialogueKeys=new Set(['loai','vai','text','npc','ten','tranh','cam','cd','cac']);
const dialogues=rawEvents.slice(sceneAt+1).filter(event=>event.type==='thoai'&&event.payload?.loai).map(event=>clean(Object.fromEntries(Object.entries(event.payload).filter(([key])=>allowedDialogueKeys.has(key)))));
const observed={
  schema_version:1,observed_on:'2026-10-22',source:'Normal guest gameplay observation on the public website; not a new REA Evidence ID.',
  privacy:'Authentication, browser storage, full profiles, timestamps, unrelated FX and player traffic were removed. The guest name is replaced with {{ten}}.',
  context:{opening_choice:0,wake_choice:1,unobserved_wake_choices:[0,2]},
  scene:clean(rawEvents[sceneAt].payload),dialogues,
  boundary:'The observed record ends after the first mother/Tri Thu instructions. Later quest dialogue and rewards in the clone are independent writing.',
};
await writeFile(reports+'/observed-wake.json',JSON.stringify(observed,null,2)+'\n');
await copyFile(reports+'/observed-wake.json',output+'/observed-wake.json');

async function digest(path){const data=await readFile(path);return {file:path.replace('/workspace/',''),bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};}
const manifestFiles=[
  research+'/live-main.js',researchV3+'/live-main.js',researchV3+'/live-main-evening.js',researchV3+'/game-evening.json',
  ...((await readdir(researchV3+'/wiki')).sort().map(name=>researchV3+'/wiki/'+name)),
  project+'/dist/assets/chan_dung_px/cd_tri_thu.png',project+'/dist/assets/chan_dung_px/cd_me.png',
  research+'/recovered-current/inputs/bundle.js',research+'/recovered-chunks/inputs/XemThuScene-DFcRKzcn.js',research+'/recovered-chunks/inputs/cayTho-DJTH3iJH.js',research+'/recovered-chunks/inputs/tho-BJRszubk.js',
];
const manifest={schema_version:1,generated_on:'2026-10-22',notes:['Hashes identify captured public inputs used for bounded research.','Browser-observation files containing authentication or full profiles are intentionally excluded.','The original game changed its public main bundle during the research window; the clone retains the frozen, tested base.'],files:[]};
for(const file of manifestFiles){try{manifest.files.push(await digest(file))}catch(error){if(error.code!=='ENOENT')throw error}}
await writeFile(reports+'/research-manifest.json',JSON.stringify(manifest,null,2)+'\n');
await copyFile(reports+'/research-manifest.json',output+'/research-manifest.json');

await copyFile(reports+'/V3-IMPLEMENTATION.md',output+'/integration-report.md');
for(const name of ['COMBAT-V3.md','ENCOUNTERS-V3.md','INVENTORY-V3.md','PROGRESSION-V3.md'])await copyFile(reports+'/'+name,output+'/'+name);

const stage=await mkdtemp(join(tmpdir(),'cotienlo-v3-source-'));
try{
  await cp(research+'/recovered-current',stage+'/recovered-main',{recursive:true});
  await cp(research+'/recovered-chunks',stage+'/recovered-chunks',{recursive:true});
  await cp(project+'/src',stage+'/independent-runtime/src',{recursive:true});
  await cp(project+'/scripts',stage+'/independent-runtime/scripts',{recursive:true});
  await mkdir(stage+'/independent-runtime/dist/data',{recursive:true});
  await mkdir(stage+'/independent-runtime/dist/assets',{recursive:true});
  await copyFile(project+'/server.mjs',stage+'/independent-runtime/server.mjs');
  await copyFile(project+'/package.json',stage+'/independent-runtime/package.json');
  await copyFile(project+'/dist/index.html',stage+'/independent-runtime/dist/index.html');
  for(const name of ['game.json','text_vi.json'])await copyFile(project+'/dist/data/'+name,stage+'/independent-runtime/dist/data/'+name);
  for(const name of await readdir(project+'/dist/assets'))if(/\.(?:js|css|woff2?)$/.test(name))await copyFile(project+'/dist/assets/'+name,stage+'/independent-runtime/dist/assets/'+name);
  await cp(project+'/dist/assets/chan_dung_px',stage+'/independent-runtime/dist/assets/chan_dung_px',{recursive:true});
  await mkdir(stage+'/docs',{recursive:true});
  for(const name of ['V3-IMPLEMENTATION.md','COMBAT-V3.md','ENCOUNTERS-V3.md','INVENTORY-V3.md','PROGRESSION-V3.md','observed-wake.json','research-manifest.json'])await copyFile(reports+'/'+name,stage+'/docs/'+name);
  await copyFile(output+'/feature-matrix.json',stage+'/docs/feature-matrix.json');
  await writeFile(stage+'/README.md','# Cổ Tiên Lộ · gói mã client V3\n\nGói này chứa bốn bundle client công khai đã khôi phục về dạng đọc được, runtime chơi đơn tự dựng, test và báo cáo nguồn. Đây không phải source backend và không phải gói asset đầy đủ. Xem `docs/V3-IMPLEMENTATION.md` để biết phần đã quan sát, phần tự dựng và giới hạn.\n');
  const archive=output+'/cotienlo-client-recovered.zip';
  await rm(archive,{force:true});
  execFileSync('zip',['-qr',archive,'.'],{cwd:stage});
  execFileSync('unzip',['-tq',archive],{stdio:'pipe'});
}finally{await rm(stage,{recursive:true,force:true})}

const archiveInfo=await stat(output+'/cotienlo-client-recovered.zip');
console.log(JSON.stringify({features:matrix.features.length,updated:Object.keys(featureUpdates).length,observed_dialogues:dialogues.length,manifest_files:manifest.files.length,archive_bytes:archiveInfo.size}));
