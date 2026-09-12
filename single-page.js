(function(){'use strict';
const realDocument=document,panels={};
const style=document.createElement('style');style.textContent='h5-scene{position:fixed;inset:0;z-index:50000;display:block;background:#182a29;animation:scene-enter .2s ease}h5-scene[hidden]{display:none!important}@keyframes scene-enter{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion:reduce){h5-scene{animation:none}}';document.head.append(style);
function initQuiz(root,document){
const state={wrong:0,entryDone:false,completed:new Set(),currentDish:'entry',currentIndex:0};

const data={
 entry:{name:'第一题｜入席：柬埔寨人的“主食担当”是谁？',img:'quiz/assets/koko.png',questions:[
  {q:'一桌典型的柬埔寨传统饭菜，如果只能选一样作为“餐桌基础”，你觉得最可能是什么？',
   opts:['面包','米饭','土豆','玉米'],a:1,
   fb:'答对了！米饭在柬埔寨传统饮食中占有非常重要的位置。传统餐桌上经常可以看到米饭搭配鱼、肉、蔬菜、汤或蘸食。'}
 ]},
 amok:{name:'អាម៉ុកត្（鱼肉阿莫克）',img:'quiz/assets/amok.png',questions:[
  {q:'面前这道鱼肉料理带有浓郁的椰香，传统做法还会使用香蕉叶制作的小盅。它最可能是哪一道柬埔寨传统料理？',
   opts:['អាម៉ុកត្（鱼肉阿莫克）','នំបញ្ចុក（柬埔寨米粉）','ឡុកឡាក់សាច់គោ（柬式炒牛肉）','សម្លកម្ល កូរ（高棉杂菜汤）'],a:0,
   fb:'认出来了！鱼肉阿莫克是柬埔寨具有代表性的传统鱼料理之一，常将鱼肉与椰奶和高棉香料等结合，并以蒸制方式烹调。'},
  {q:'为什么传统的鱼肉阿莫克常常会使用香蕉叶来盛装？',
   opts:['香蕉叶可以让鱼肉自动变甜','香蕉叶可以折成天然容器，也适合用于蒸制和呈现','香蕉叶是柬埔寨人唯一使用的餐具','香蕉叶可以代替椰奶'],a:1,
   fb:'答对了！香蕉叶可以折叠成小盅，用于盛放食材进行蒸制，也具有很强的传统视觉辨识度。'}
 ]},
 loklak:{name:'ឡុកឡាក់សាច់គោ（柬式炒牛肉）',img:'quiz/assets/loklak.png',questions:[
  {q:'这道柬式炒牛肉旁边，经常会出现一小碟酸、咸、辛香的蘸汁。下面哪一种搭配最符合这道菜的典型吃法？',
   opts:['青柠＋盐＋胡椒','巧克力＋牛奶','椰奶＋白糖','蜂蜜＋芥末'],a:0,
   fb:'没错！柬式炒牛肉常搭配生菜、番茄等蔬菜，并配以青柠、盐和胡椒调制的蘸汁。'}
 ]},
 koko:{name:'សម្លកម្ល កូរ（高棉杂菜汤）',img:'quiz/assets/koko.png',questions:[
  {q:'高棉杂菜汤里往往可以出现多种蔬菜、香料以及其他食材。这更接近哪一种传统饮食思路？',
   opts:['每一道菜只能有一种主要食材','用多种食材共同烹煮，形成丰富的味道','所有食材都必须油炸','主要依靠辣椒制造味道'],a:1,
   fb:'答对了！高棉杂菜汤的特点之一就是使用多种食材共同烹煮，也可随季节和当地食材变化。'}
 ]},
 prahok:{name:'ប្ហុកខ្ទិះ（发酵鱼酱配椰奶）',img:'quiz/assets/prahok.png',questions:[
  {q:'第一次闻到这种“味道很冲”的鱼酱，下面哪个解释最准确？',
   opts:['发酵鱼制品本来就是腐烂的鱼','经过盐腌和发酵制作的传统鱼制品','是一种特殊奶酪','是辣椒酱的另一种叫法'],a:1,
   fb:'答对了！ប្ហុក 是经过盐腌和发酵制作的传统鱼制品，会形成明显的气味和鲜味。'},
  {q:'如果把柬埔寨传统饮食比作一张地图，为什么“鱼”会占据这么重要的位置？',
   opts:['因为柬埔寨禁止吃其他肉类','因为柬埔寨拥有丰富的河流、湖泊和洪泛区，鱼类资源十分重要','因为鱼比米饭更容易种植','因为鱼只能在柬埔寨生存'],a:1,
   fb:'答对了！湄公河、洞里萨湖以及大量与季节性洪水相关的水域，使鱼类长期成为当地饮食中的重要食物来源。'},
  {q:'判断题：柬埔寨传统菜肴普遍都非常辣，辣椒是高棉料理最核心的味道。',
   opts:['√ 正确','× 错误'],a:1,
   fb:'答对了！不能把高棉料理简单概括成“非常辣”，酸、咸、甜、鲜、香等不同味道之间的平衡同样重要。'}
 ]},
 numansom:{name:'នំអន្សមចេក（香蕉糯米糕）',img:'quiz/assets/numansom.png',questions:[
  {q:'晚餐结束，一份被香蕉叶包得严严实实的长条形糕点出现了。打开后里面是糯米和香蕉。这种糕点特别与什么联系在一起？',
   opts:['柬埔寨传统节庆','足球比赛','海鲜市场开业','婚礼上专门用来代替婚戒'],a:0,
   fb:'最后一题答对！这类传统糯米糕与柬埔寨节庆饮食文化有密切联系，也常见于家庭活动。'}
 ]}
};

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const quiz=$('#quizLayer'), answers=$('#answers'), fb=$('#feedback');

function sync(){
 $('#doneText').textContent=`${state.completed.size}/5`;
 $('#progressImg').src=`quiz/assets/progress_${state.completed.size}.png`;
 $$('#wrongRow i').forEach((x,i)=>x.classList.toggle('on',i<state.wrong));
 $$('.dish').forEach(b=>b.classList.toggle('done',state.completed.has(b.dataset.dish)));
}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(window.tt);window.tt=setTimeout(()=>e.classList.remove('show'),1200)}
function openQuiz(key){
 state.currentDish=key;state.currentIndex=0;renderQuestion();quiz.classList.add('show')
}
function renderQuestion(){
 const d=data[state.currentDish],q=d.questions[state.currentIndex];
 $('#quizFood').src=d.img;
 $('#quizName').innerHTML=d.name+`<small>${state.currentDish==='entry'?'必须先完成这一题，再开始自由点菜':'点击正确选项继续'}</small>`;
 $('#qNo').textContent=state.currentDish==='entry'?'第 1 题｜入席题':`本菜第 ${state.currentIndex+1}/${d.questions.length} 题`;
 $('#qText').textContent=q.q;
 answers.innerHTML='';fb.classList.remove('show');$('#continueBtn').style.display='none';$('#retryBtn').classList.remove('show');
 q.opts.forEach((t,i)=>{
  const b=document.createElement('button');b.className='answer';b.dataset.letter=String.fromCharCode(65+i);b.textContent=t;
  b.onclick=()=>choose(i,b);answers.appendChild(b);
 });
}
function choose(i,b){
 const d=data[state.currentDish],q=d.questions[state.currentIndex];
 $$('.answer').forEach(x=>x.disabled=true);
 if(i===q.a){
  b.classList.add('correct');$('#feedbackIcon').src='quiz/assets/ui_check.png';$('#feedbackTitle').textContent='答对了！';$('#feedbackText').textContent=q.fb;
  $('#continueBtn').style.display='block';$('#retryBtn').classList.remove('show');fb.classList.add('show');
 }else{
  b.classList.add('wrong');state.wrong++;sync();$('#feedbackIcon').src='quiz/assets/ui_cross.png';$('#feedbackTitle').textContent='再想想～';
  $('#feedbackText').textContent='这个答案不对，可以继续尝试其他选项。';$('#retryBtn').classList.add('show');$('#continueBtn').style.display='none';fb.classList.add('show');
  if(state.wrong>=3)setTimeout(()=>$('#failOverlay').classList.add('show'),360);
 }
}
$('#retryBtn').onclick=renderQuestion;
$('#continueBtn').onclick=()=>{
 const d=data[state.currentDish];
 if(state.currentIndex<d.questions.length-1){state.currentIndex++;renderQuestion();return}
 if(state.currentDish==='entry'){
   state.entryDone=true;quiz.classList.remove('show');$('#tableHint').classList.add('show');toast('入席题完成，现在可以自由点菜');
 }else{
   state.completed.add(state.currentDish);quiz.classList.remove('show');toast('这道菜已完成 ✓');
 }
 sync();
 if(state.completed.size===5)setTimeout(()=>$('#winOverlay').classList.add('show'),450);
};
$$('.dish').forEach(b=>b.onclick=()=>{
 if(!state.entryDone){toast('请先完成第一题');openQuiz('entry');return}
 if(state.completed.has(b.dataset.dish)){toast('这道菜已经认识过啦！');return}
 openQuiz(b.dataset.dish);
});
$('#restartBtn').onclick=()=>{
 state.wrong=0;state.entryDone=false;state.completed.clear();state.currentDish='entry';state.currentIndex=0;
 $('#failOverlay').classList.remove('show');$('#winOverlay').classList.remove('show');$('#tableHint').classList.remove('show');sync();openQuiz('entry');
};
$('#continueStoryBtn').onclick=()=>{$('#winOverlay').classList.remove('show');H5Story.chat('after',function(){H5App.home();});};
$('#playAgainBtn').onclick=()=>{$('#toast').classList.remove('show');clearTimeout(window.tt);$('#restartBtn').click();};

sync();
/* First question is now mandatory and appears automatically. */
openQuiz('entry');

root.querySelector('#tableHomeBtn').onclick=e=>{e.preventDefault();H5App.home();};return {reset:()=>root.querySelector('#playAgainBtn').click()};}
function initKnowledge(root,document){const cards=[{"icon":"🍚","tag":"饮食与自然","title":"吃饭这件小事，其实很“柬埔寨”","body":["如果你刚刚吃完了这一桌菜，也许已经发现：**米饭、鱼、蔬菜和发酵风味**总是在不同菜里反复出现。","这并不是巧合。柬埔寨人的饮食与当地的自然环境紧密相连。稻米长期是重要主食，而湄公河、洞里萨湖和洪泛区带来的丰富淡水鱼，则让“鱼”成为餐桌上非常重要的角色。","鱼吃不完怎么办？人们还发展出了 **ប្រហុក（Prahok，发酵鱼制品）** 等保存和调味方式。于是，一顿饭里其实藏着一条很清楚的线：","🌾 **稻田提供主食，河湖提供鱼类，人们再用自己的方法保存和烹饪食物。**","所以，认识柬埔寨，不一定非要从历史书开始。","**也可以先从一碗饭开始。**"]},{"icon":"🏛️","tag":"吴哥与城市","title":"你看到的是吴哥寺庙，古人经营的却是一座城市","body":["提到吴哥，很多人的第一反应都是：**“巨大的寺庙。”**","但真正让吴哥文明有意思的，并不只有那些高耸的石塔。","在吴哥地区，人们修建了大型蓄水池、渠道、堤坝等水利设施，把季节性变化明显的水资源组织进城市和农业生产之中。寺庙、道路、居民活动区域与水利系统共同组成了庞大的吴哥城市景观。","💧 **换句话说，吴哥不只是“建得漂亮”，还需要解决一个非常现实的问题——这么多人生活在这里，水从哪里来，又该往哪里去？**","今天我们仰头看的是石塔。","但理解吴哥，有时候还要**低头看看水是怎么流的。**"]},{"icon":"🔤","tag":"文字与日常","title":"刚才那些“弯弯曲曲”的字，你其实已经看了一路","body":["អាម៉ុកត្រី\nសម្លកកូរ\nប្រហុកខ្ទិះ","是不是有点眼熟？","没错——**游戏中每一道菜的菜名，就是高棉文字。**","高棉文字拥有悠久的历史，其发展与南亚文字传统存在历史联系，并在漫长的发展过程中形成了自己的书写体系。今天，它仍然用于柬埔寨人的日常书写：新闻、路牌、菜单、课本、聊天信息……都能看到它。","对习惯汉字和拉丁字母的人来说，高棉文字密集的弧线和圆形结构可能会显得非常陌生。","但对柬埔寨人来说，它不是“神秘符号”。","📱 **它就是每天用来读书、点菜、看路牌和发消息的文字。**","所以当你已经能认出 **អាម៉ុកត្រី** 是鱼肉阿莫克时——","**恭喜，你已经认出了自己的第一个高棉语菜名。**"]},{"icon":"🧣","tag":"织物与生活","title":"一块格子布，到底能有多少份“兼职”？","body":["第一次看到**ក្រមា（水布）**，你可能会以为：","**“哦，是一种传统围巾。”**","但如果真的进入柬埔寨人的生活，就会发现——它远不止是围巾。","天气热时，可以用它**擦汗、遮阳、包头**；需要携带东西时，可以用来**包裹物品**；在一些生活场景中，它还可以帮助**抱孩子**；当然，它也可以直接围在脖子上，成为日常穿搭的一部分。","🧣☀️👶","也就是说，同一块水布，上一秒可能还在脖子上，下一秒就开始“工作”了。","更特别的是，与水布有关的传统织造、使用方式和文化表达并没有只停留在过去。**2024年，“与柬埔寨传统织物 ក្រមា 有关的文化实践与表达”被列入 UNESCO 人类非物质文化遗产代表作名录。**","真正有生命力的传统，不一定被锁在博物馆里。","**它也可能就在一个普通人的肩膀上。**"]},{"icon":"🙏","tag":"礼仪与尊重","title":"都是双手合十，为什么还不能“随便合”？","body":["在柬埔寨，你可能会看到一种很常见的礼仪动作：","双手合十，身体微微前倾。","它通常被称为**សំពះ（合十礼）**。","看起来很简单，对吧？","但 **សំពះ（合十礼）** 不只是一个统一的“你好”动作。在传统礼仪中，面对不同的人和不同场合，**双手抬起的位置、低头的程度以及动作表达的尊敬程度都可能有所区别。**","例如，面对长辈、老师或具有宗教身份的人时，礼仪表达通常会更加郑重。","🙏 **所以，同样是双手合十，背后其实在回答一个问题：**","**“我正在和谁说话？”**","这也是为什么跨文化交流有时候并不只是“学会一句你好”。","真正重要的，是慢慢读懂——","**一个动作背后，对方表达尊重的方式。**"]}];let index=0;function render(){const c=cards[index];document.querySelector('#tag').textContent=c.tag;document.querySelector('#counter').textContent=`${index+1} / ${cards.length}`;document.querySelector('#icon').textContent=c.icon;document.querySelector('#title').textContent=c.title;const content=document.querySelector('#content');content.replaceChildren();for(const text of c.body){const p=document.createElement('p');text.split('**').forEach((part,i)=>{const el=i%2?document.createElement('strong'):document.createTextNode(part);if(i%2)el.textContent=part;p.append(el)});content.append(p)}document.querySelector('#prev').disabled=index===0;document.querySelector('#next').disabled=index===cards.length-1;document.querySelector('.reading').scrollTop=0;}document.querySelector('#prev').onclick=()=>{if(index>0){index--;render()}};document.querySelector('#next').onclick=()=>{if(index<cards.length-1){index++;render()}};render();
root.querySelector('.home').onclick=e=>{e.preventDefault();H5App.home();};return {};}
function mount(kind){const host=document.createElement('h5-scene');host.id=kind+'-scene';host.hidden=true;host.setAttribute('aria-label',kind==='quiz'?'餐桌答题':'文化知识卡');const root=host.attachShadow({mode:'open'});root.append(document.getElementById(kind+'-template').content.cloneNode(true));document.body.append(host);const facade={querySelector:s=>root.querySelector(s),querySelectorAll:s=>root.querySelectorAll(s),createElement:t=>realDocument.createElement(t),createTextNode:t=>realDocument.createTextNode(t)};const controller=(kind==='quiz'?initQuiz:initKnowledge)(root,facade);const panel=panels[kind]={host,root,controller};if(kind==='quiz'){function fit(){const v=window.visualViewport;host.style.setProperty('--fit',Math.min((v?v.width:innerWidth)/390,(v?v.height:innerHeight)/844));}fit();addEventListener('resize',fit);if(window.visualViewport)visualViewport.addEventListener('resize',fit);}return panel;}
window.H5App={active:'intro',show(kind){if(!['quiz','knowledge'].includes(kind))return;const existed=!!panels[kind];const panel=panels[kind]||mount(kind);if(kind==='quiz'&&existed)panel.controller.reset();const scene=Mugeda.getMugedaObject().scene;scene.pause();scene.dom.inert=true;for(const p of Object.values(panels))p.host.hidden=p!==panel;panel.host.hidden=false;this.active=kind;panel.root.querySelector('button,a')?.focus({preventScroll:true});},home(){const scene=Mugeda.getMugedaObject().scene;scene.gotoPage(0);scene.dom.inert=false;for(const p of Object.values(panels))p.host.hidden=true;this.active='intro';setTimeout(()=>document.getElementById('cover-start')?.focus({preventScroll:true}),120);}};
})();