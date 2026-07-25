(function(){

const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));

let state={
  html:'',
  sha:'',
  section:'',
  games:[],
  dirty:false
};


const defaults={
  owner:'pinkgame12',
  repo:'flashcardstest',
  branch:'main',
  theme:'dark',
  workerUrl:''
};


function getSettings(){
  return {
    ...defaults,
    ...JSON.parse(
      localStorage.getItem('sfc_admin_settings')||'{}'
    )
  };
}


function saveSettings(s){
  localStorage.setItem(
    'sfc_admin_settings',
    JSON.stringify(s)
  );
}


function toast(msg){

const el=document.createElement('div');

el.className='toast';

el.textContent=msg;

$('#toastRegion').append(el);

setTimeout(()=>el.remove(),4200);

}



function loading(on){

$('#loadingOverlay')
.classList
.toggle(
  'hidden',
  !on
);

}



function page(name){

$$('.page').forEach(p=>
p.classList.remove('active')
);

$(`#${name}Page`)
.classList.add('active');


$('#pageTitle')
.textContent=
name[0].toUpperCase()+name.slice(1);


$$('nav a')
.forEach(a=>
a.classList.toggle(
'active',
a.dataset.page===name
)
);

}




function refreshStats(){

const g=state.games;

$('#totalGames').textContent=g.length;

$('#newGames').textContent=
g.filter(x=>x.badge==='New').length;

$('#hotGames').textContent=
g.filter(x=>x.badge==='Hot').length;

$('#fixedGames').textContent=
g.filter(x=>x.badge==='Fixed').length;


$('#recentlyUpdated')
.textContent=
state.sha
?
`Loaded ${g.length} cards from games.html at ${new Date().toLocaleString()}.`
:
'Sync the repository to load live website data.';

}





function renderGames(){

const q=$('#gameSearch').value.toLowerCase();

const list=$('#gamesList');

list.innerHTML='';


state.games
.filter(g=>
[g.title,g.url,g.badge]
.join(' ')
.toLowerCase()
.includes(q)
)
.forEach(g=>{


const row=document.createElement('article');


row.className='game-row';


row.innerHTML=`

<div class="game-thumb"
style="background-image:url('${g.image.replace(/'/g,'%27')}')">
</div>


<div class="game-meta">

<h3>${g.title}</h3>

<p>${g.url}</p>

${g.badge!=='None'
?
`<span class="badge">${g.badge}</span>`
:''
}

</div>


<div class="row-actions">

<button class="btn" data-edit="${g.index}">
Edit
</button>


<button class="btn" data-copy="${g.index}">
Duplicate
</button>


<button class="btn" data-up="${g.index}">
↑
</button>


<button class="btn" data-down="${g.index}">
↓
</button>


<button class="btn danger" data-del="${g.index}">
Delete
</button>


</div>

`;


list.append(row);


});


$('#gamesEmpty')
.classList
.toggle(
'hidden',
!!list.children.length
);


}





function applySection(newSection){

state.section=newSection;

state.html=
SFCParser.replaceGameSection(
state.html,
newSection
);


state.games=
SFCParser.parseGameCards(
newSection
);


state.dirty=true;


refreshStats();

renderGames();

}





async function sync(){

loading(true);


try{


const f=
await SFCGitHub.downloadGamesHTML();


state.html=f.html;

state.sha=f.sha;


state.section=
SFCParser.extractGameSection(
f.html
).section;


state.games=
SFCParser.parseGameCards(
state.section
);


state.dirty=false;


refreshStats();

renderGames();

loadNotification();


toast(
'Repository synced.'
);



}catch(e){

toast(e.message);


}

finally{

loading(false);

}


}






function modal(html){

$('#modalRoot').innerHTML=
`<div class="modal">${html}</div>`;


$('#modalRoot')
.classList
.remove('hidden');


$$('[data-close]')
.forEach(b=>
b.onclick=closeModal
);

}



function closeModal(){

$('#modalRoot')
.classList
.add('hidden');


$('#modalRoot')
.innerHTML='';

}




function loadNotification(){

const m=
state.html.match(
/<h3 style="font-family: Comic Sans MS; color:red">([\s\S]*?)<\/h3>/i
);


$('#announcementInput').value=
m?m[1].trim():'';


$('#notificationPreview')
.innerHTML=
$('#announcementInput').value;

}




function notificationHtml(){

return state.html.replace(

/(<h3 style="font-family: Comic Sans MS; color:red">)[\s\S]*?(<\/h3>)/i,

`$1
${$('#announcementInput').value}
$2`

);

}




async function saveGames(){

loading(true);

try{

const r=
await SFCGitHub.commitGamesHTML(
state.html,
state.sha
);


state.sha=
r.content.sha;


toast(
'games.html committed.'
);


}catch(e){

toast(e.message);

}

finally{

loading(false);

}

}





async function saveNotice(){

loading(true);


try{

state.html=
notificationHtml();


const r=
await SFCGitHub.commitNotifications(
state.html,
state.sha
);


state.sha=
r.content.sha;


toast(
'Notification committed.'
);


}catch(e){

toast(e.message);

}

finally{

loading(false);

}

}






function initSettings(){

const s=getSettings();


$('#ownerInput').value=s.owner;

$('#repoInput').value=s.repo;

$('#branchInput').value=s.branch;

$('#workerUrlInput').value=s.workerUrl;

$('#themeInput').value=s.theme;


$('#currentRepo').textContent=
`${s.owner}/${s.repo}@${s.branch}`;


$('#githubLink').href=
`https://github.com/${s.owner}/${s.repo}`;

}





async function initAuth(){

if(SFCGitHub.hasToken()){


try{


const u=
await SFCGitHub.getCurrentUser();


$('#currentUser')
.textContent=
`@${u.login}`;


$('#loginView')
.classList
.add('hidden');


$('#appView')
.classList
.remove('hidden');


sync();



}catch(e){

toast(e.message);

}


}

}





$('#loginBtn').onclick=
async()=>{

loading(true);


try{

await SFCGitHub.login();

await initAuth();

toast(
'Signed in.'
);


}catch(e){

toast(e.message);

}


finally{

loading(false);

}

};





$('#logoutBtn').onclick=
()=>{

SFCGitHub.logout();

location.reload();

};





$('#syncBtn').onclick=sync;

$('#saveGamesBtn').onclick=saveGames;

$('#saveNotificationsBtn').onclick=saveNotice;


$('#gameSearch').oninput=renderGames;


$('#announcementInput').oninput=
()=>{

$('#notificationPreview')
.innerHTML=
$('#announcementInput').value;

};





$('#saveSettingsBtn').onclick=
()=>{


saveSettings({

owner:
$('#ownerInput').value,

repo:
$('#repoInput').value,

branch:
$('#branchInput').value,

workerUrl:
$('#workerUrlInput').value,

theme:
$('#themeInput').value

});


initSettings();

toast(
'Settings saved.'
);


};





window.addEventListener(
'hashchange',
()=>page(
(location.hash||'#dashboard').slice(1)
)
);



initSettings();

page(
(location.hash||'#dashboard').slice(1)
);


initAuth();



})();
