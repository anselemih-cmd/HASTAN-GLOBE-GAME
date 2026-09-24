let activationLocked=false;

function isActivationLocked(){
return activationLocked===true;
}

function requireActiveAccount(){

if(!isActivationLocked())
return true;

openModal(
"Account Pending",
"Akaunti yako bado haija-activate. Tafadhali subiri Payment Admin athibitishe malipo yako ya TSh 10,000.",
"🔐"
);

return false;
}

function showPage(pageId,clickedButton){

if(!requireActiveAccount())
return false;

const pages=document.querySelectorAll("#normalApp .page");
const selected=document.getElementById(pageId);

if(!selected){
console.error("HASTAN GLOBE: page not found:",pageId);
return false;
}

pages.forEach(p=>{
p.classList.remove("active");
p.style.display="none";
});

selected.classList.add("active");
selected.style.display="block";

document.querySelectorAll(".bottom-nav .nav-btn")
.forEach(b=>b.classList.remove("active"));

if(clickedButton){

clickedButton.classList.add("active");

}else{

const map={
homePage:0,
teamPage:1,
earningsPage:2,
profilePage:3
};

if(map[pageId]!=null){

const btn=document.querySelectorAll(
".bottom-nav .nav-btn"
)[map[pageId]];

if(btn)
btn.classList.add("active");

}

}

window.scrollTo(0,0);

if(pageId==="withdrawPage" && window.loadWithdrawalHistory){
window.loadWithdrawalHistory();
}

/* TEAM REFRESH */
if(pageId==="teamPage" && window.loadTeamMembers){
window.loadTeamMembers();
}

return false;
}

window.showPage=showPage;

function showPageFromMenu(pageId){

if(!requireActiveAccount())
return false;

closeMenu();

return showPage(pageId,null);
}

window.showPageFromMenu=showPageFromMenu;

function openMenu(){

if(!requireActiveAccount())
return;

const m=document.getElementById("sideMenu");
const o=document.getElementById("overlay");

if(m)m.classList.add("open");
if(o)o.classList.add("show");
}

window.openMenu=openMenu;

function closeMenu(){

const m=document.getElementById("sideMenu");
const o=document.getElementById("overlay");

if(m)m.classList.remove("open");
if(o)o.classList.remove("show");
}

window.closeMenu=closeMenu;

function showGamer(){

if(!requireActiveAccount())
return;

closeMenu();

const n=document.getElementById("normalApp");
const g=document.getElementById("gamerMode");

if(n)n.style.display="none";
if(g)g.classList.add("active");

window.scrollTo(0,0);

if(window.updateGamerBalance)
window.updateGamerBalance();
}

window.showGamer=showGamer;

function backNormal(){

const n=document.getElementById("normalApp");
const g=document.getElementById("gamerMode");

if(g)g.classList.remove("active");
if(n)n.style.display="block";

window.scrollTo(0,0);
}

window.backNormal=backNormal;

function showGamerSub(pageId){

if(!requireActiveAccount())
return;

document.querySelectorAll(".gamer-page")
.forEach(p=>p.classList.remove("active"));

const selected=document.getElementById(pageId);

if(selected)
selected.classList.add("active");

window.scrollTo(0,0);
}

window.showGamerSub=showGamerSub;


/* =====================================================
   NORMAL NOTIFICATIONS BUTTON
===================================================== */

function showNotifications(){

if(!requireActiveAccount())
return;

showPage("notificationsPage",null);

setTimeout(()=>{

if(window.markNotificationsAsRead){

window.markNotificationsAsRead();

}

},100);

}

window.showNotifications=showNotifications;


function showGamerNotifications(){

if(!requireActiveAccount())
return;

openModal(
"Gamer Notifications",
"No new gamer notifications.",
"🔔"
);

}

window.showGamerNotifications=showGamerNotifications;


function notAvailable(name){

if(!requireActiveAccount())
return;

openModal(
name,
name+" is not available yet. It will be added later.",
"ℹ️"
);
}

window.notAvailable=notAvailable;


/* =====================================================
   SWAHILI CHAT / VELORA CHAT
===================================================== */

function openSwahiliChat(){

if(!requireActiveAccount())
return;

const chatTab=
window.open(
"https://line",
"_blank"
);

openModal(
"Swahili Chat",
"Reach 30 referrals to start chat.",
"💬"
);

if(chatTab){

setTimeout(()=>{

try{

chatTab.close();

}catch(e){

console.warn(
"Unable to close Velora Chat tab:",
e
);

}

},7000);

}

}

window.openSwahiliChat=openSwahiliChat;


function openModal(title,message,icon){

const modal=document.getElementById("modal");

document.getElementById("modalTitle").innerText=title;
document.getElementById("modalMessage").innerText=message;
document.getElementById("modalIcon").innerText=icon||"ℹ️";

modal.classList.add("show");
}

window.openModal=openModal;

function closeModal(){

const modal=document.getElementById("modal");

if(modal)
modal.classList.remove("show");
}

window.closeModal=closeModal;

function copyReferral(){

if(!requireActiveAccount())
return;

const el=document.getElementById("referralLink");
const text=el?el.innerText:"";

if(!text||text==="Please login..."){

openModal(
"Login Required",
"Please login first to get your personal referral link.",
"🔐"
);

return;
}

if(navigator.clipboard){

navigator.clipboard.writeText(text)
.then(()=>{

openModal(
"Copied",
"Your personal referral link has been copied.",
"🔗"
);

})
.catch(()=>{

openModal("Referral Link",text,"🔗");

});

}else{

openModal("Referral Link",text,"🔗");

}

}

window.copyReferral=copyReferral;

function withdraw(){

if(!requireActiveAccount())
return;

showPage("withdrawPage",null);
}

window.withdraw=withdraw;

async function submitWithdrawal(){

if(!requireActiveAccount())
return;

if(window.normalWithdrawalProcessing){

openModal(
"Please Wait",
"Your withdrawal request is already being processed.",
"⏳"
);

return;
}

const amountInput=document.getElementById("withdrawAmount");
const numberInput=document.getElementById("withdrawNumber");

const amount=Number(amountInput?.value||0);
const number=numberInput?.value.trim()||"";

if(amount<12000){

openModal(
"Minimum Withdrawal",
"Minimum withdrawal is TSh 12,000.",
"⚠️"
);

return;
}

if(!number){

openModal(
"Payment Number",
"Please enter your payment number.",
"⚠️"
);

return;
}

if(window.createWithdrawalRequest){

await window.createWithdrawalRequest(amount,number);

}else{

openModal(
"System Error",
"Withdrawal system is not ready.",
"⚠️"
);

}

}

window.submitWithdrawal=submitWithdrawal;

async function submitGamerResult(){

if(!requireActiveAccount())
return;

const opponent=document.getElementById(
"opponentInput"
).value.trim();

const yourScore=Number(
document.getElementById("yourScore").value||0
);

const opponentScore=Number(
document.getElementById("opponentScore").value||0
);

const proof=document.getElementById("proofImage");

if(!opponent){

openModal(
"Opponent Required",
"Please enter your opponent username.",
"⚠️"
);

return;
}

if(yourScore<0||opponentScore<0){

openModal(
"Invalid Score",
"Scores cannot be negative.",
"⚠️"
);

return;
}

if(!proof.files||!proof.files.length){

openModal(
"Proof Required",
"Please select the match proof image.",
"⚠️"
);

return;
}

openModal(
"Result Ready",
"Your match result is ready for the Gamer verification system. Image upload/storage must be connected before final submission.",
"📤"
);

}

window.submitGamerResult=submitGamerResult;

async function withdrawGamer(){

if(!requireActiveAccount())
return;

if(!window.createGamerWithdrawalRequest){

openModal(
"System Error",
"Gamer withdrawal system is not ready.",
"⚠️"
);

return;

}

const number=document.getElementById(
"gamerWithdrawNumber"
).value.trim();

if(!number){

openModal(
"Payment Number",
"Please enter your payment number.",
"⚠️"
);

return;
}

await window.createGamerWithdrawalRequest(number);
}

window.withdrawGamer=withdrawGamer;

document.addEventListener("DOMContentLoaded",()=>{

const home=document.getElementById("homePage");

if(home){

document.querySelectorAll("#normalApp .page")
.forEach(p=>{
p.style.display=p===home?"block":"none";
});

home.classList.add("active");

}

});

import {
auth,
db
}
from "./firebase-config.js";

import {
collection,
getDocs,
doc,
getDoc,
setDoc,
runTransaction,
serverTimestamp,
query,
where,
onSnapshot,
arrayUnion
}
from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
onAuthStateChanged,
signInWithEmailAndPassword,
signOut
}
from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =====================================================
   ADMIN CONFIG - PRESERVED
===================================================== */

const MAIN_ADMIN_UID=
"FkMOO6jsgJZvnJV36sl3RrHLd063";

const PAYMENT_ADMIN_UID=
"bRcIg5YO4ZheYcF9wlqI9K1Bphq2";

const MAIN_ADMIN_PAGE=
"./admin.html";

const PAYMENT_ADMIN_PAGE=
"./payment-admin.html";

const SYSTEM_DIRECT_LINK=
"https://hastanglobe.com/register";


let currentUser=null;
let currentUserData=null;

let balanceUnsubscribe=null;
let gamerBalanceUnsubscribe=null;
let withdrawalHistoryInterval=null;


/* =====================================================
   NOTIFICATION LISTENERS
===================================================== */

let notificationsUnsubscribe=null;
let notificationUserUnsubscribe=null;

let normalNotifications=[];
let readNotificationIds=new Set();

window.normalWithdrawalProcessing=false;


/* =====================================================
   ACTIVATION SYSTEM
===================================================== */

function normalizeActivationStatus(data){

if(!data)
return "pending";

const raw=data.activationStatus;

if(
typeof raw==="string" &&
raw.trim()
){

return raw.trim().toLowerCase();
}

if(data.isActivated===true)
return "active";

return "active";
}


function isAccountActive(data){

const status=normalizeActivationStatus(data);

return status==="active" ||
status==="approved";
}


function isAccountPending(data){

return !isAccountActive(data);
}


function updateActivationStatusUI(status){

const profileStatus=
document.getElementById("profileStatus");

if(profileStatus){

if(
status==="active" ||
status==="approved"
){

profileStatus.innerText="Active";
profileStatus.style.color="#087443";

}else{

profileStatus.innerText="Pending Activation";
profileStatus.style.color="#9a6700";

}

}

const statusBox=
document.getElementById("activationStatusText");

if(statusBox){

if(
status==="active" ||
status==="approved"
){

statusBox.className=
"activation-status approved";

statusBox.innerText=
"✅ Account yako ime-activate. Karibu HASTAN GLOBE!";

}else{

statusBox.className=
"activation-status";

statusBox.innerText=
"⏳ Account yako inasubiri Payment Admin athibitishe activation.";

}

}

}


function showActivationScreen(data){

activationLocked=true;

const normalApp=
document.getElementById("normalApp");

const gamer=
document.getElementById("gamerMode");

const activation=
document.getElementById("activationScreen");

if(normalApp)
normalApp.style.display="none";

if(gamer)
gamer.classList.remove("active");

if(activation)
activation.classList.add("show");

updateActivationStatusUI(
normalizeActivationStatus(data)
);

}


function hideActivationScreen(){

activationLocked=false;

const activation=
document.getElementById("activationScreen");

const normalApp=
document.getElementById("normalApp");

if(activation)
activation.classList.remove("show");

if(normalApp)
normalApp.style.display="block";

}


window.checkActivationStatus=
async function(){

if(!currentUser)
return;

try{

const snap=
await getDoc(
doc(
db,
"users",
currentUser.uid
)
);

if(!snap.exists()){

showActivationScreen({
activationStatus:"pending"
});

return;
}

const data=snap.data();

currentUserData=data;

const status=
normalizeActivationStatus(data);

if(isAccountActive(data)){

hideActivationScreen();

writeUserUi(data);

openModal(
"Account Activated",
"Malipo yako yamehakikiwa. Akaunti yako sasa iko active.",
"✅"
);

await loadAllFirebaseContent();

}else{

showActivationScreen(data);

openModal(
"Still Pending",
"Akaunti yako bado haija-activate. Subiri Payment Admin athibitishe malipo yako.",
"⏳"
);

}

}catch(error){

console.error(
"checkActivationStatus",
error
);

openModal(
"Error",
"Imeshindikana kuangalia activation status. Jaribu tena.",
"⚠️"
);

}

};


/* =====================================================
   ROLE SYSTEM
===================================================== */

function getUserRole(user){

if(!user)
return "guest";

if(user.uid===MAIN_ADMIN_UID)
return "main_admin";

if(user.uid===PAYMENT_ADMIN_UID)
return "payment_admin";

return "normal_user";

}

function isAdminUser(user){

const role=getUserRole(user);

return role==="main_admin"||
role==="payment_admin";

}


function redirectAdminUser(user){

if(!user)
return false;

const role=getUserRole(user);

if(role==="main_admin"){

localStorage.setItem(
"hastan_admin_session",
"true"
);

localStorage.setItem(
"hastan_admin_uid",
user.uid
);

window.location.replace(
MAIN_ADMIN_PAGE
);

return true;

}

if(role==="payment_admin"){

localStorage.setItem(
"hastan_payment_admin_session",
"true"
);

localStorage.setItem(
"hastan_payment_admin_uid",
user.uid
);

window.location.replace(
PAYMENT_ADMIN_PAGE
);

return true;

}

return false;

}


/* =====================================================
   HELPERS
===================================================== */

function escapeHtml(v){

return String(v??"")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}


function money(v){

return Number(v||0).toLocaleString();

}


function generateReferralCode(uid){

return "HG"+
String(uid||"")
.replace(/[^a-zA-Z0-9]/g,"")
.slice(0,8)
.toUpperCase();

}


function cleanUsername(value){

let username=
String(value||"")
.trim()
.toLowerCase();

username=
username
.replace(/\s+/g,"")
.replace(/[^a-z0-9._-]/g,"");

return username||"user";

}


function getUsername(data,user){

if(
data &&
typeof data.username==="string" &&
data.username.trim()
){

return cleanUsername(data.username);

}

if(
data &&
typeof data.userName==="string" &&
data.userName.trim()
){

return cleanUsername(data.userName);

}

return "user";

}


function referralLinkFromCode(referralCode){

return SYSTEM_DIRECT_LINK+
"?ref="+
encodeURIComponent(
String(referralCode||"").trim().toUpperCase()
);

}


/* =====================================================
   SETTINGS UI
===================================================== */

function updateSettingsUI(user){

const lo=
document.getElementById("settingsLoggedOut");

const li=
document.getElementById("settingsLoggedIn");

const email=
document.getElementById("loggedInEmail");

if(user){

if(lo)lo.style.display="none";
if(li)li.style.display="block";

if(email)
email.innerText=
user.email||"Logged in account";

}else{

if(lo)lo.style.display="block";
if(li)li.style.display="none";

if(email)
email.innerText="--";

}

}


/* =====================================================
   USER UI
===================================================== */

function writeUserUi(data){

currentUserData=data;

const main=
Number(data.mainBalance||0);

const activity=
Number(data.activityEarnings||0);

const net=
Number(
data.netProfit!=null
?
data.netProfit
:
main+activity
);

const expenses=10000;

document.querySelectorAll("#mainBalance")
.forEach(e=>{
e.innerText="TSh "+money(main);
});

document.querySelectorAll("#netProfit")
.forEach(e=>{
e.innerText="TSh "+money(net);
});

document.querySelectorAll("#expensesBalance")
.forEach(e=>{
e.innerText="TSh "+money(expenses);
});

const withdrawAvailableBalance=
document.getElementById("withdrawAvailableBalance");

if(withdrawAvailableBalance)
withdrawAvailableBalance.innerText=
"TSh "+money(main);

const eb=
document.getElementById("earningsMainBalance");

if(eb)
eb.innerText="TSh "+money(main);

const ea=
document.getElementById("earningsActivity");

if(ea)
ea.innerText="TSh "+money(activity);

const en=
document.getElementById("earningsNetProfit");

if(en)
en.innerText="TSh "+money(net);

const username=
getUsername(data,currentUser);

const welcomeName=
document.getElementById("welcomeName");

if(welcomeName)
welcomeName.innerText=
"Karibu, "+username+"! 👋";

const welcomeMessage=
document.getElementById("welcomeMessage");

if(welcomeMessage)
welcomeMessage.innerText=
"Karibu kwenye HASTAN GLOBE, "+
username+
". Tunafurahi kukuona tena!";

const profileName=
document.getElementById("profileName");

if(profileName)
profileName.innerText=username;

const profileUsername=
document.getElementById("profileUsername");

if(profileUsername)
profileUsername.innerText=username;

const gamerName=
document.getElementById("gamerProfileName");

if(gamerName)
gamerName.innerText=username;

const rankingName=
document.getElementById("rankingUserName");

if(rankingName)
rankingName.innerText=username;

const profileEmail=
document.getElementById("profileEmail");

if(profileEmail)
profileEmail.innerText=
data.email||
currentUser?.email||
"--";

const gamerId=
document.getElementById("gamerId");

if(gamerId)
gamerId.innerText=
data.eFootballId||
data.referralCode||
"--";

const profileReferralId=
document.getElementById("profileReferralId");

if(profileReferralId)
profileReferralId.innerText=
data.referralCode||
"--";

const personal=
referralLinkFromCode(
data.referralCode
);

const referralLink=
document.getElementById("referralLink");

if(referralLink)
referralLink.innerText=personal;

const l1=
Number(data.level1Count||0);

const l2=
Number(data.level2Count||0);

const total=
Number(
data.totalTeam!=null
?
data.totalTeam
:
l1+l2
);

[
"level1Count",
"level2Count",
"totalTeam"
].forEach((id,i)=>{

const e=document.getElementById(id);

if(e)
e.innerText=[l1,l2,total][i];

});

const teamLevel1=
document.getElementById("teamLevel1");

if(teamLevel1)
teamLevel1.innerText=l1+" Members";

const teamLevel2=
document.getElementById("teamLevel2");

if(teamLevel2)
teamLevel2.innerText=l2+" Members";

const teamSummary=
document.getElementById("teamSummary");

if(teamSummary)
teamSummary.innerHTML=
"Level 1: "+l1+
" Members<br>Level 2: "+l2+
" Members<br>Total Team: "+total+
" Members";

updateActivationStatusUI(
normalizeActivationStatus(data)
);

}


/* =====================================================
   TEAM SYSTEM
===================================================== */

function teamStatus(data){

const status=
String(
data?.activationStatus||"pending"
)
.trim()
.toLowerCase();

if(
status==="active"||
status==="approved"
){

return{
className:"active",
label:"Active"
};

}

if(status==="rejected"){

return{
className:"rejected",
label:"Rejected"
};

}

return{
className:"pending",
label:"Pending Activation"
};

}


function teamDate(value){

if(!value)
return "Date not available";

let date=null;

try{

if(
value &&
typeof value.toDate==="function"
){

date=value.toDate();

}else if(value instanceof Date){

date=value;

}else if(typeof value==="number"){

date=new Date(value);

}else if(typeof value==="string"){

date=new Date(value);

}

}catch(e){

date=null;

}

if(!date||isNaN(date.getTime()))
return "Date not available";

return date.toLocaleString(
"en-GB",
{
day:"2-digit",
month:"short",
year:"numeric",
hour:"2-digit",
minute:"2-digit"
}
);

}


function createTeamMemberCard(data){

const username=
getUsername(data,null);

const fullName=
String(
data.fullName||
data.displayName||
username||
"User"
).trim();

const email=
data.email||"--";

const phone=
data.phone||"--";

const status=
teamStatus(data);

const firstLetter=
String(fullName||"U")
.charAt(0)
.toUpperCase();

const card=
document.createElement("div");

card.className="team-member-card";

card.innerHTML=

'<div class="team-member-top">'+

'<div class="team-member-avatar">'+
escapeHtml(firstLetter)+
'</div>'+

'<div style="flex:1;min-width:0">'+

'<div class="team-member-name">'+
escapeHtml(fullName)+
'</div>'+

'<div class="team-member-username">@'+
escapeHtml(username)+
'</div>'+

'<span class="team-member-status '+
status.className+
'">'+
escapeHtml(status.label)+
'</span>'+

'</div>'+

'</div>'+

'<div class="team-member-info">'+

'<div><strong>Email:</strong> '+
escapeHtml(email)+
'</div>'+

'<div><strong>Phone:</strong> '+
escapeHtml(phone)+
'</div>'+

'<div><strong>Joined:</strong> '+
escapeHtml(teamDate(data.createdAt))+
'</div>'+

'</div>';

return card;

}


function chunkArray(array,size){

const chunks=[];

for(let i=0;i<array.length;i+=size){

chunks.push(
array.slice(i,i+size)
);

}

return chunks;

}


async function getLevel2Members(level1Users){

if(!level1Users.length)
return [];

const level1Ids=
level1Users
.map(x=>x.uid)
.filter(Boolean);

if(!level1Ids.length)
return [];

const chunks=
chunkArray(level1Ids,30);

const level2Map=new Map();

for(const chunk of chunks){

if(!chunk.length)
continue;

const q=
query(
collection(db,"users"),
where("referredBy","in",chunk)
);

const snap=
await getDocs(q);

snap.forEach(d=>{

if(!level2Map.has(d.id)){

level2Map.set(
d.id,
{
uid:d.id,
...d.data()
}
);

}

});

}

return Array.from(
level2Map.values()
);

}


window.loadTeamMembers=
async function(){

if(!currentUser){

const l1c=
document.getElementById(
"level1MembersContainer"
);

const l2c=
document.getElementById(
"level2MembersContainer"
);

if(l1c){

l1c.innerHTML=
'<div class="empty-state">🔐 Please login to view your team.</div>';

}

if(l2c){

l2c.innerHTML=
'<div class="empty-state">🔐 Please login to view your team.</div>';

}

return;

}

if(activationLocked){

const l1c=
document.getElementById(
"level1MembersContainer"
);

const l2c=
document.getElementById(
"level2MembersContainer"
);

if(l1c){

l1c.innerHTML=
'<div class="empty-state">🔐 Activate your account first.</div>';

}

if(l2c){

l2c.innerHTML=
'<div class="empty-state">🔐 Activate your account first.</div>';

}

return;

}

const level1Container=
document.getElementById(
"level1MembersContainer"
);

const level2Container=
document.getElementById(
"level2MembersContainer"
);

if(!level1Container||!level2Container)
return;

level1Container.innerHTML=
'<div class="loading-state">Loading your direct team...</div>';

level2Container.innerHTML=
'<div class="loading-state">Loading Level 2...</div>';

try{

const level1Query=
query(
collection(db,"users"),
where(
"referredBy",
"==",
currentUser.uid
)
);

const level1Snap=
await getDocs(level1Query);

const level1Users=[];

level1Snap.forEach(d=>{

level1Users.push({
uid:d.id,
...d.data()
});

});

const level1Count=
level1Users.length;

const level1Badge=
document.getElementById(
"teamLevel1Badge"
);

if(level1Badge)
level1Badge.innerText=level1Count;

const level1TopCount=
document.getElementById(
"level1Count"
);

if(level1TopCount)
level1TopCount.innerText=level1Count;

const level1Reward=
document.getElementById(
"teamLevel1"
);

if(level1Reward)
level1Reward.innerText=
level1Count+
" Members";

if(!level1Users.length){

level1Container.innerHTML=
'<div class="empty-state">'+
'👥 Bado hujamwalika member yeyote moja kwa moja.<br>'+
'<small style="display:block;margin-top:7px">'+
'Shiriki referral link yako ili member mpya aonekane hapa automatically.'+
'</small>'+
'</div>';

}else{

level1Container.innerHTML="";

level1Users.sort((a,b)=>{

const aTime=
a.createdAt &&
typeof a.createdAt.toMillis==="function"
?
a.createdAt.toMillis()
:
0;

const bTime=
b.createdAt &&
typeof b.createdAt.toMillis==="function"
?
b.createdAt.toMillis()
:
0;

return bTime-aTime;

});

level1Users.forEach(member=>{

level1Container.appendChild(
createTeamMemberCard(member)
);

});

}

const level2Users=
await getLevel2Members(level1Users);

const level2Count=
level2Users.length;

const level2Badge=
document.getElementById(
"teamLevel2Badge"
);

if(level2Badge)
level2Badge.innerText=level2Count;

const level2TopCount=
document.getElementById(
"level2Count"
);

if(level2TopCount)
level2TopCount.innerText=level2Count;

const level2Reward=
document.getElementById(
"teamLevel2"
);

if(level2Reward)
level2Reward.innerText=
level2Count+
" Members";

if(!level2Users.length){

level2Container.innerHTML=
'<div class="empty-state">'+
'👥 Hakuna Level 2 members bado.'+
'</div>';

}else{

level2Container.innerHTML="";

level2Users.sort((a,b)=>{

const aTime=
a.createdAt &&
typeof a.createdAt.toMillis==="function"
?
a.createdAt.toMillis()
:
0;

const bTime=
b.createdAt &&
typeof b.createdAt.toMillis==="function"
?
b.createdAt.toMillis()
:
0;

return bTime-aTime;

});

level2Users.forEach(member=>{

level2Container.appendChild(
createTeamMemberCard(member)
);

});

}

const totalTeam=
level1Count+
level2Count;

const totalElement=
document.getElementById(
"totalTeam"
);

if(totalElement)
totalElement.innerText=totalTeam;

const summary=
document.getElementById(
"teamSummary"
);

if(summary){

summary.innerHTML=
"Level 1: "+
level1Count+
" Members<br>"+
"Level 2: "+
level2Count+
" Members<br>"+
"Total Team: "+
totalTeam+
" Members";

}

try{

await setDoc(
doc(db,"users",currentUser.uid),
{
level1Count:level1Count,
level2Count:level2Count,
totalTeam:totalTeam,
teamUpdatedAt:serverTimestamp()
},
{
merge:true
}
);

if(currentUserData){

currentUserData.level1Count=
level1Count;

currentUserData.level2Count=
level2Count;

currentUserData.totalTeam=
totalTeam;

}

}catch(counterError){

console.warn(
"Team counter sync skipped:",
counterError
);

}

console.log(
"HASTAN GLOBE TEAM:",
{
level1:level1Count,
level2:level2Count,
total:totalTeam
}
);

}catch(error){

console.error(
"HASTAN GLOBE loadTeamMembers:",
error
);

level1Container.innerHTML=
'<div class="error-state">'+
'⚠️ Unable to load your Team.<br>'+
'<small style="display:block;margin-top:7px">'+
escapeHtml(error.message||"Firestore error")+
'</small>'+
'</div>';

level2Container.innerHTML=
'<div class="error-state">'+
'⚠️ Unable to load Level 2 Team.'+
'</div>';

}

};


/* =====================================================
   ENSURE USER PROFILE
===================================================== */

async function ensureUserProfile(user){

const ref=
doc(db,"users",user.uid);

const snap=
await getDoc(ref);

const old=
snap.exists()
?
snap.data()
:
{};

const username=
getUsername(old,user);

const code=
old.referralCode||
generateReferralCode(user.uid);

const link=
referralLinkFromCode(code);

const oldMain=
Number(old.mainBalance||0);

const oldActivity=
Number(old.activityEarnings||0);

const oldNet=
Number(
old.netProfit!=null
?
old.netProfit
:
oldMain+oldActivity
);

let activationStatus;

if(snap.exists()){

if(
typeof old.activationStatus==="string" &&
old.activationStatus.trim()
){

activationStatus=
old.activationStatus.toLowerCase();

}else if(old.isActivated===true){

activationStatus="active";

}else{

activationStatus="active";

}

}else{

activationStatus="pending";

}

const base={

uid:user.uid,

email:
user.email||
old.email||
"",

username:username,

displayName:
old.displayName||
user.displayName||
username||
"User",

referralCode:code,

referralLink:link,

mainBalance:oldMain,

activityEarnings:oldActivity,

netProfit:oldNet,

expenses:10000,

level1Count:
Number(old.level1Count||0),

level2Count:
Number(old.level2Count||0),

totalTeam:
Number(old.totalTeam||0),

/*
   OLD FIELD KEPT FOR COMPATIBILITY.
   It is NO LONGER used to block Spin Wheel.
*/
spinUsed:
old.spinUsed===true,

/*
   NEW:
   Stores the current Spin Wheel cycle used by
   this account.
*/
spinCycleId:
String(old.spinCycleId||""),

activationStatus:activationStatus

};

if(!snap.exists()){

base.createdAt=
serverTimestamp();

}

await setDoc(
ref,
base,
{merge:true}
);

return{
...old,
...base
};

}


/* =====================================================
   GAMER BALANCE
===================================================== */

async function ensureGamerBalance(user){

const ref=
doc(db,"users",user.uid);

const snap=
await getDoc(ref);

if(!snap.exists())
return 0;

const data=snap.data();

if(
data.gamerBalance!==undefined &&
data.gamerBalance!==null
){

return Number(data.gamerBalance||0);

}

try{

await setDoc(
ref,
{gamerBalance:0},
{merge:true}
);

return 0;

}catch(e){

console.error(
"ensureGamerBalance",
e
);

return 0;

}

}


function updateGamerBalanceUI(balance){

balance=Number(balance||0);

[
"gameBalance",
"gamerBalance",
"gamerWalletBalance"
].forEach(id=>{

const e=document.getElementById(id);

if(e)
e.innerText="TSh "+money(balance);

});

}


window.updateGamerBalance=
async function(){

if(!currentUser)
return;

if(activationLocked)
return;

try{

const snap=
await getDoc(
doc(db,"users",currentUser.uid)
);

if(snap.exists()){

const data=snap.data();

if(!isAccountActive(data))
return;

const balance=
Number(data.gamerBalance||0);

updateGamerBalanceUI(balance);

}

}catch(e){

console.error(
"updateGamerBalance",
e
);

}

};


function listenToGamerBalance(user){

if(gamerBalanceUnsubscribe)
gamerBalanceUnsubscribe();

const userRef=
doc(db,"users",user.uid);

let active=true;

const refresh=async()=>{

if(activationLocked)
return;

try{

const snap=
await getDoc(userRef);

if(
active &&
snap.exists()
){

const data=snap.data();

if(!isAccountActive(data))
return;

const balance=
Number(data.gamerBalance||0);

updateGamerBalanceUI(balance);

}

}catch(e){

console.error(
"gamer balance refresh",
e
);

}

};

refresh();

const interval=setInterval(refresh,5000);

gamerBalanceUnsubscribe=()=>{

active=false;
clearInterval(interval);

};

}


/* =====================================================
   USER BALANCE LISTENER
===================================================== */

function listenToUserBalance(user){

if(balanceUnsubscribe)
balanceUnsubscribe();

const userRef=
doc(db,"users",user.uid);

let active=true;

const refresh=async()=>{

try{

const s=
await getDoc(userRef);

if(
active &&
s.exists()
){

const data=s.data();

currentUserData=data;

if(!isAccountActive(data)){

showActivationScreen(data);

return;

}

if(activationLocked)
hideActivationScreen();

writeUserUi(data);

}

}catch(e){

console.error(
"user balance refresh",
e
);

}

};

refresh();

const interval=setInterval(refresh,5000);

balanceUnsubscribe=()=>{

active=false;
clearInterval(interval);

};

}


/* =====================================================
   WITHDRAWAL HISTORY
===================================================== */

function formatWithdrawalDate(value){

if(!value)
return "Date not available";

let date=null;

try{

if(typeof value.toDate==="function")
date=value.toDate();

else if(value instanceof Date)
date=value;

else if(typeof value==="number")
date=new Date(value);

else if(typeof value==="string")
date=new Date(value);

}catch(e){

date=null;

}

if(!date||isNaN(date.getTime()))
return "Date not available";

return date.toLocaleString(
"en-GB",
{
day:"2-digit",
month:"short",
year:"numeric",
hour:"2-digit",
minute:"2-digit"
}
);

}


function getWithdrawalStatusClass(status){

const s=
String(status||"pending").toLowerCase();

if(s==="paid")
return "paid";

if(s==="rejected")
return "rejected";

return "pending";

}


function getWithdrawalStatusLabel(status){

const s=
String(status||"pending").toLowerCase();

if(s==="paid")
return "Paid";

if(s==="rejected")
return "Rejected";

return "Pending";

}


window.loadWithdrawalHistory=
async function(){

const container=
document.getElementById(
"withdrawalHistoryContainer"
);

if(!container)
return;

if(!currentUser){

container.innerHTML=
'<div class="withdraw-history-empty">🔐 Please login to view your withdrawal history.</div>';

return;

}

if(isAdminUser(currentUser)){

container.innerHTML=
'<div class="withdraw-history-empty">Admin accounts do not use Normal Dashboard withdrawal history.</div>';

return;

}

if(activationLocked){

container.innerHTML=
'<div class="withdraw-history-empty">🔐 Activate your account first.</div>';

return;

}

container.innerHTML=
'<div class="withdraw-history-loading">Loading withdrawal history...</div>';

try{

const q=
query(
collection(db,"withdrawals"),
where("uid","==",currentUser.uid)
);

const snap=
await getDocs(q);

const withdrawals=[];

snap.forEach(d=>{

const data=d.data();

withdrawals.push({
id:d.id,
...data
});

});

withdrawals.sort((a,b)=>{

const getTime=(x)=>{

try{

if(
x.createdAt &&
typeof x.createdAt.toDate==="function"
)
return x.createdAt.toDate().getTime();

if(typeof x.createdAt==="number")
return x.createdAt;

if(typeof x.createdAt==="string"){

const t=
new Date(x.createdAt).getTime();

return isNaN(t)?0:t;

}

}catch(e){}

return 0;

};

return getTime(b)-getTime(a);

});

if(!withdrawals.length){

container.innerHTML=
'<div class="withdraw-history-empty">📭 No withdrawal transactions yet.</div>';

return;

}

container.innerHTML="";

withdrawals.forEach(item=>{

const statusClass=
getWithdrawalStatusClass(item.status);

const statusLabel=
getWithdrawalStatusLabel(item.status);

const typeLabel=
String(item.type||"normal").toLowerCase()==="gamer"
?
"Gamer Withdrawal"
:
"Normal Withdrawal";

const card=document.createElement("div");

card.className=
"withdraw-history-item "+
statusClass;

card.innerHTML=

'<div class="withdraw-history-top">'+

'<div class="withdraw-history-amount">'+
'TSh '+
escapeHtml(money(item.amount||0))+
'</div>'+

'<div class="withdraw-status '+
statusClass+
'">'+
escapeHtml(statusLabel)+
'</div>'+

'</div>'+

'<div class="withdraw-history-row">'+
'<span class="withdraw-history-label">Payment Number</span>'+
'<span class="withdraw-history-value">'+
escapeHtml(item.paymentNumber||"--")+
'</span>'+
'</div>'+

'<div class="withdraw-history-row">'+
'<span class="withdraw-history-label">Type</span>'+
'<span class="withdraw-history-value">'+
escapeHtml(typeLabel)+
'</span>'+
'</div>'+

'<div class="withdraw-history-row">'+
'<span class="withdraw-history-label">Date</span>'+
'<span class="withdraw-history-value">'+
escapeHtml(formatWithdrawalDate(item.createdAt))+
'</span>'+
'</div>';

container.appendChild(card);

});

}catch(error){

console.error(
"loadWithdrawalHistory",
error
);

container.innerHTML=
'<div class="withdraw-history-error">⚠️ Unable to load withdrawal history right now. Please try again.</div>';

}

};


function startWithdrawalHistoryListener(user){

if(withdrawalHistoryInterval){

clearInterval(withdrawalHistoryInterval);

withdrawalHistoryInterval=null;

}

if(!user)
return;

if(isAdminUser(user))
return;

withdrawalHistoryInterval=
setInterval(()=>{

if(activationLocked)
return;

const page=
document.getElementById("withdrawPage");

if(
page &&
page.classList.contains("active")
){

loadWithdrawalHistory();

}

},5000);

}


function stopWithdrawalHistoryListener(){

if(withdrawalHistoryInterval){

clearInterval(withdrawalHistoryInterval);

withdrawalHistoryInterval=null;

}

}


/* =====================================================
   ACTIVITY REWARD
===================================================== */

async function creditActivityReward(
activityId,
activityName,
reward
){

if(!requireActiveAccount())
return{
ok:false,
reason:"activation_pending"
};

if(!currentUser){

openModal(
"Login Required",
"Please login before completing activities.",
"🔐"
);

return{
ok:false,
reason:"login"
};

}

reward=Number(reward||0);

if(reward<=0){

openModal(
"Invalid Reward",
"This activity has no valid reward configured.",
"⚠️"
);

return{
ok:false,
reason:"zero"
};

}

const ref=
doc(db,"users",currentUser.uid);

try{

let result={
credited:false,
already:false
};

await runTransaction(
db,
async tx=>{

const snap=
await tx.get(ref);

if(!snap.exists())
throw new Error("User profile not found.");

const d=snap.data();

if(!isAccountActive(d))
throw new Error("ACCOUNT_NOT_ACTIVE");

const completed={
...(d.completedActivities||{})
};

if(completed[activityId]){

result.already=true;
return;

}

const main=
Number(d.mainBalance||0);

const activity=
Number(d.activityEarnings||0)+reward;

const oldNet=
Number(
d.netProfit!=null
?
d.netProfit
:
main+
Number(d.activityEarnings||0)
);

const newNet=oldNet+reward;

tx.update(
ref,
{
activityEarnings:activity,
netProfit:newNet,
[`completedActivities.${activityId}`]:{
name:activityName,
reward:reward,
completedAt:Date.now()
}
}
);

result.credited=true;

}
);

if(result.credited){

openModal(
"Activity Completed",
activityName+
" completed successfully. TSh "+
money(reward)+
" has been added to Activity Earnings.",
"✅"
);

}else if(result.already){

openModal(
"Already Completed",
"You have already received the reward for this activity.",
"ℹ️"
);

}

return{
ok:true,
...result
};

}catch(error){

console.error(
"creditActivityReward",
error
);

if(error.message==="ACCOUNT_NOT_ACTIVE"){

showActivationScreen(
currentUserData||{
activationStatus:"pending"
}
);

return{
ok:false,
reason:"activation_pending"
};

}

openModal(
"Reward Error",
"Unable to add the reward right now. Please try again.",
"⚠️"
);

return{
ok:false,
reason:"error"
};

}

}


/* =====================================================
   REFERRAL COMMISSION
===================================================== */

async function creditReferralCommission(amount){

if(!currentUser)
return;

if(activationLocked)
return;

amount=Number(amount||0);

if(amount<=0)
return;

const ref=
doc(db,"users",currentUser.uid);

await runTransaction(
db,
async tx=>{

const s=
await tx.get(ref);

if(!s.exists())
throw new Error("User not found");

const d=s.data();

if(!isAccountActive(d))
throw new Error("ACCOUNT_NOT_ACTIVE");

const main=
Number(d.mainBalance||0)+amount;

const activity=
Number(d.activityEarnings||0);

const oldNet=
Number(
d.netProfit!=null
?
d.netProfit
:
Number(d.mainBalance||0)+activity
);

const newNet=oldNet+amount;

tx.update(
ref,
{
mainBalance:main,
netProfit:newNet
}
);

}
);

}


/* =====================================================
   SPIN WHEEL - CYCLE BASED
===================================================== */

/*
   IMPORTANT:

   Spin Wheel is no longer lifetime-based.

   User can spin ONCE for the current cycle.

   Example:

   cycleId = "spin_2026_09_15"

   User spins:
   users/{uid}.spinCycleId
   becomes "spin_2026_09_15"

   Same cycle:
   BLOCKED

   Admin creates new cycle:
   cycleId = "spin_2026_09_16"

   User can spin again.

   Firestore transaction is the final protection.
*/

async function creditSpinReward(
amount,
name,
cycleId
){

if(!requireActiveAccount())
return{
ok:false,
reason:"activation_pending"
};

if(!currentUser){

openModal(
"Login Required",
"Please login before using Spin Wheel.",
"🔐"
);

return{
ok:false,
reason:"login"
};

}

amount=Number(amount||0);

if(amount<=0){

openModal(
"Invalid Reward",
"This Spin Wheel reward is invalid.",
"⚠️"
);

return{
ok:false,
reason:"invalid_reward"
};

}

cycleId=
String(cycleId||"").trim();

if(!cycleId){

openModal(
"Spin Wheel",
"Spin schedule is not configured yet. Please wait for Main Admin to configure the current Spin schedule.",
"⚠️"
);

return{
ok:false,
reason:"no_cycle"
};

}

const ref=
doc(
db,
"users",
currentUser.uid
);

try{

let result={
ok:false,
already:false,
newBalance:0
};

await runTransaction(
db,
async tx=>{

const s=
await tx.get(ref);

if(!s.exists())
throw new Error("USER_NOT_FOUND");

const d=s.data();

if(!isAccountActive(d))
throw new Error("ACCOUNT_NOT_ACTIVE");


/*
   ONE SPIN PER CURRENT CYCLE.
*/
if(
String(d.spinCycleId||"")===cycleId
){

result.already=true;
return;

}

const main=
Number(d.mainBalance||0);

const activity=
Number(d.activityEarnings||0);

const oldNet=
Number(
d.netProfit!=null
?
d.netProfit
:
main+activity
);

const newBalance=
main+amount;

const newNet=
oldNet+amount;


/*
   IMPORTANT:

   We save ONLY the current cycle ID.
   We do NOT set spinUsed=true.
*/
tx.update(
ref,
{
mainBalance:newBalance,
activityEarnings:activity,
netProfit:newNet,

spinCycleId:cycleId,

spinUsedAt:serverTimestamp(),

lastSpinReward:amount,

lastSpinRewardName:
name||"Reward"
}
);

result.ok=true;
result.newBalance=newBalance;

}
);


/*
   SAME CYCLE
*/
if(result.already){

const button=
document.getElementById(
"firebaseSpinButton"
);

if(button){

button.disabled=true;
button.innerText="SPIN USED";

}

openModal(
"Spin Already Used",
"You have already used your Spin Wheel for this current schedule. You can spin again when a new Spin schedule starts.",
"ℹ️"
);

return{
ok:false,
already:true
};

}


/*
   SUCCESS
*/
if(result.ok){

const button=
document.getElementById(
"firebaseSpinButton"
);

if(button){

button.disabled=true;
button.innerText="SPIN USED";

}

openModal(
"Spin Result",
(name||"Reward")+
" — TSh "+
money(amount)+
" has been added to your Main Balance. You can spin again when the next Spin schedule starts.",
"🎡"
);

try{

const s=
await getDoc(ref);

if(s.exists())
writeUserUi(s.data());

}catch(refreshError){

console.error(
"Spin balance refresh error",
refreshError
);

}

return{
ok:true
};

}

return{
ok:false
};

}catch(e){

console.error(
"creditSpinReward",
e
);

if(e.message==="ACCOUNT_NOT_ACTIVE"){

showActivationScreen(
currentUserData||{
activationStatus:"pending"
}
);

return{
ok:false,
reason:"activation_pending"
};

}

if(e.message==="USER_NOT_FOUND"){

openModal(
"Account Error",
"Your HASTAN GLOBE account profile could not be found.",
"⚠️"
);

return{
ok:false
};

}

openModal(
"Spin Error",
"Unable to add the Spin Wheel reward right now. Please try again.",
"⚠️"
);

return{
ok:false
};

}

}


/* =====================================================
   NORMAL WITHDRAWAL
===================================================== */

window.createWithdrawalRequest=
async function(amount,number){

if(!requireActiveAccount())
return{
ok:false
};

if(!currentUser){

openModal(
"Login Required",
"Please login before requesting a withdrawal.",
"🔐"
);

return{
ok:false
};

}

if(isAdminUser(currentUser)){

redirectAdminUser(currentUser);

return{
ok:false
};

}

amount=Number(amount||0);
number=String(number||"").trim();

if(!Number.isFinite(amount)){

openModal(
"Invalid Amount",
"Please enter a valid withdrawal amount.",
"⚠️"
);

return{
ok:false
};

}

if(amount<12000){

openModal(
"Minimum Withdrawal",
"The minimum withdrawal amount is TSh 12,000.",
"⚠️"
);

return{
ok:false
};

}

if(!Number.isInteger(amount)){

openModal(
"Invalid Amount",
"Withdrawal amount must be a whole number.",
"⚠️"
);

return{
ok:false
};

}

if(!number){

openModal(
"Payment Number",
"Please enter your payment number.",
"⚠️"
);

return{
ok:false
};

}

if(window.normalWithdrawalProcessing){

openModal(
"Please Wait",
"Your previous withdrawal request is still being processed.",
"⏳"
);

return{
ok:false
};

}

window.normalWithdrawalProcessing=true;

const button=
document.getElementById(
"withdrawSubmitButton"
);

if(button){

button.disabled=true;

button.dataset.originalText=
button.innerText;

button.innerText=
"Processing Withdrawal...";

}

try{

const userRef=
doc(db,"users",currentUser.uid);

const withdrawalRef=
doc(collection(db,"withdrawals"));

let remainingBalance=0;

await runTransaction(
db,
async tx=>{

const userSnap=
await tx.get(userRef);

if(!userSnap.exists())
throw new Error("USER_PROFILE_NOT_FOUND");

const userData=userSnap.data();

if(!isAccountActive(userData))
throw new Error("ACCOUNT_NOT_ACTIVE");

const currentBalance=
Number(userData.mainBalance||0);

const activity=
Number(userData.activityEarnings||0);

if(currentBalance<12000)
throw new Error("MINIMUM_BALANCE_NOT_REACHED");

if(amount>currentBalance)
throw new Error("INSUFFICIENT_MAIN_BALANCE");

remainingBalance=
currentBalance-amount;

const lifetimeNet=
Number(
userData.netProfit!=null
?
userData.netProfit
:
currentBalance+activity
);

tx.update(
userRef,
{
mainBalance:remainingBalance,
netProfit:lifetimeNet,
lastWithdrawalAt:serverTimestamp()
}
);

tx.set(
withdrawalRef,
{
uid:currentUser.uid,
email:currentUser.email||"",
amount:amount,
paymentNumber:number,
status:"pending",
type:"normal",
balanceDeducted:true,
balanceBefore:currentBalance,
balanceAfter:remainingBalance,
createdAt:serverTimestamp(),
updatedAt:serverTimestamp()
}
);

}
);

openModal(
"Withdrawal Pending",
"Your withdrawal of TSh "+
money(amount)+
" has been submitted successfully. The amount has been reserved from your Main Balance and is pending Payment Admin approval.",
"⏳"
);

const amountInput=
document.getElementById("withdrawAmount");

const numberInput=
document.getElementById("withdrawNumber");

if(amountInput)
amountInput.value="";

if(numberInput)
numberInput.value="";

try{

const updated=
await getDoc(userRef);

if(updated.exists())
writeUserUi(updated.data());

}catch(balanceError){

console.error(
"Balance refresh error",
balanceError
);

}

await loadWithdrawalHistory();

return{
ok:true,
withdrawalId:withdrawalRef.id
};

}catch(e){

console.error(
"createWithdrawalRequest",
e
);

if(e.message==="ACCOUNT_NOT_ACTIVE"){

showActivationScreen(
currentUserData||{
activationStatus:"pending"
}
);

return{
ok:false,
error:e.message
};

}

let message=
"Unable to submit the withdrawal right now. Please try again.";

if(e.message==="MINIMUM_BALANCE_NOT_REACHED"){

message=
"Your Main Balance must be at least TSh 12,000 before you can withdraw.";

}

if(e.message==="INSUFFICIENT_MAIN_BALANCE"){

message=
"The withdrawal amount is greater than your available Main Balance.";

}

if(e.message==="USER_PROFILE_NOT_FOUND"){

message=
"Your account profile could not be found.";

}

openModal(
"Withdrawal Error",
message,
"⚠️"
);

return{
ok:false,
error:e.message
};

}finally{

window.normalWithdrawalProcessing=false;

if(button){

button.disabled=false;

button.innerText=
button.dataset.originalText||
"Submit Withdrawal";

}

}

};


/* =====================================================
   GAMER WITHDRAWAL
===================================================== */

window.createGamerWithdrawalRequest=
async function(paymentNumber){

if(!requireActiveAccount())
return;

if(!currentUser){

openModal(
"Login Required",
"Please login before requesting a Gamer withdrawal.",
"🔐"
);

return;
}

if(isAdminUser(currentUser)){

redirectAdminUser(currentUser);
return;

}

paymentNumber=
String(paymentNumber||"").trim();

if(!paymentNumber){

openModal(
"Payment Number",
"Please enter your payment number.",
"⚠️"
);

return;
}

const userRef=
doc(db,"users",currentUser.uid);

try{

const userSnap=
await getDoc(userRef);

if(!userSnap.exists()){

openModal(
"Account Error",
"Your account profile could not be found.",
"⚠️"
);

return;

}

const userData=userSnap.data();

if(!isAccountActive(userData)){

showActivationScreen(userData);
return;

}

const gamerAmount=
Number(userData.gamerBalance||0);

if(gamerAmount<=0){

openModal(
"No Gamer Balance",
"You do not have a Gamer Balance available for withdrawal.",
"ℹ️"
);

return;

}

await setDoc(
doc(collection(db,"withdrawals")),
{
uid:currentUser.uid,
email:currentUser.email||"",
amount:gamerAmount,
paymentNumber:paymentNumber,
status:"pending",
type:"gamer",
balanceDeducted:false,
createdAt:serverTimestamp(),
updatedAt:serverTimestamp()
}
);

openModal(
"Gamer Withdrawal Pending",
"Your Gamer withdrawal request has been sent to Payment Admin for approval.",
"⏳"
);

const input=
document.getElementById(
"gamerWithdrawNumber"
);

if(input)
input.value="";

}catch(e){

console.error(
"createGamerWithdrawalRequest",
e
);

openModal(
"Gamer Withdrawal Error",
"Unable to submit your Gamer withdrawal right now.",
"⚠️"
);

}

};


/* =====================================================
   LOGIN
===================================================== */

window.loginUser=
async function(){

const email=
document.getElementById("loginEmail").value.trim();

const password=
document.getElementById("loginPassword").value;

const err=
document.getElementById("loginError");

const ok=
document.getElementById("loginSuccess");

const btn=
document.getElementById("loginButton");

err.style.display="none";
ok.style.display="none";

if(!email||!password){

err.innerText=
"Please enter your email and password.";

err.style.display="block";

return;

}

btn.disabled=true;
btn.innerText="Logging in...";

try{

const result=
await signInWithEmailAndPassword(
auth,
email,
password
);

const user=result.user;

const role=getUserRole(user);

if(role==="main_admin"){

localStorage.setItem(
"hastan_admin_session",
"true"
);

localStorage.setItem(
"hastan_admin_uid",
user.uid
);

ok.innerText=
"Main Admin verified. Opening Main Admin Panel...";

ok.style.display="block";

document.getElementById(
"loginPassword"
).value="";

window.location.replace(
MAIN_ADMIN_PAGE
);

return;

}

if(role==="payment_admin"){

localStorage.setItem(
"hastan_payment_admin_session",
"true"
);

localStorage.setItem(
"hastan_payment_admin_uid",
user.uid
);

ok.innerText=
"Payment Admin verified. Opening Payment Admin Panel...";

ok.style.display="block";

document.getElementById(
"loginPassword"
).value="";

window.location.replace(
PAYMENT_ADMIN_PAGE
);

return;

}

localStorage.setItem(
"normal_user",
"true"
);

localStorage.setItem(
"normal_user_uid",
user.uid
);

ok.innerText=
"Login successful. Checking account activation...";

ok.style.display="block";

document.getElementById(
"loginPassword"
).value="";

}catch(e){

console.error(e);

let m=
"Login failed. Please check your email and password.";

if(e.code==="auth/invalid-credential")
m="Incorrect email or password.";

if(e.code==="auth/user-not-found")
m="No account was found with this email.";

if(e.code==="auth/wrong-password")
m="Incorrect password.";

if(e.code==="auth/invalid-email")
m="Please enter a valid email address.";

if(e.code==="auth/too-many-requests")
m="Too many login attempts. Please try again later.";

err.innerText=m;
err.style.display="block";

}finally{

btn.disabled=false;
btn.innerText="🔐 Ingia HASTAN GLOBE";

}

};


/* =====================================================
   LOGOUT
===================================================== */

window.logoutUser=
async function(){

try{

await signOut(auth);

localStorage.removeItem("normal_user");
localStorage.removeItem("normal_user_uid");

localStorage.removeItem("hastan_admin_session");
localStorage.removeItem("hastan_admin_uid");

localStorage.removeItem("hastan_payment_admin_session");
localStorage.removeItem("hastan_payment_admin_uid");

activationLocked=false;

stopNotificationListeners();

const activation=
document.getElementById("activationScreen");

if(activation)
activation.classList.remove("show");

openModal(
"Logged Out",
"You have successfully logged out of your HASTAN GLOBE account.",
"🚪"
);

showPageWithoutActivation("settingsPage",null);

}catch(e){

console.error(e);

openModal(
"Logout Error",
"Unable to logout right now. Please try again.",
"⚠️"
);

}

};


function showPageWithoutActivation(pageId,clickedButton){

const pages=
document.querySelectorAll("#normalApp .page");

const selected=
document.getElementById(pageId);

if(!selected)
return false;

pages.forEach(p=>{
p.classList.remove("active");
p.style.display="none";
});

selected.classList.add("active");
selected.style.display="block";

document.querySelectorAll(".bottom-nav .nav-btn")
.forEach(b=>b.classList.remove("active"));

window.scrollTo(0,0);

return false;

}


/* =====================================================
   LOGGED OUT UI
===================================================== */

function showLoginMessages(){

[
"tasksContainer",
"videosContainer",
"postersContainer",
"adsContainer",
"quizContainer",
"spinContainer",
"notificationsContainer"
].forEach(id=>{

const c=document.getElementById(id);

if(c)
c.innerHTML=
'<div class="empty-state">🔐 Please login to view this content.</div>';

});

updateNotificationBadge(0);

const s=
document.getElementById("normalSchedules");

if(s)
s.innerHTML=
'<div class="empty-state">🔐 Ingia kuona ratiba za Main Admin.</div>';

const referralLink=
document.getElementById("referralLink");

if(referralLink)
referralLink.innerText="Please login...";

updateGamerBalanceUI(0);

const withdrawalContainer=
document.getElementById("withdrawalHistoryContainer");

if(withdrawalContainer)
withdrawalContainer.innerHTML=
'<div class="withdraw-history-empty">🔐 Please login to view your withdrawal history.</div>';

const available=
document.getElementById("withdrawAvailableBalance");

if(available)
available.innerText="TSh 0";


/* TEAM LOGGED OUT */

const l1=
document.getElementById(
"level1MembersContainer"
);

const l2=
document.getElementById(
"level2MembersContainer"
);

if(l1)
l1.innerHTML=
'<div class="empty-state">🔐 Please login to view your team.</div>';

if(l2)
l2.innerHTML=
'<div class="empty-state">🔐 Please login to view your team.</div>';

}


/* =====================================================
   FIREBASE CONTENT
===================================================== */

async function loadAllFirebaseContent(){

if(activationLocked)
return;

await Promise.allSettled([

loadNormalSchedules(),
loadTasks(),
loadVideos(),
loadImageAds(),
loadTravelQuizzes(),
loadSpinWheel(),
loadNotifications(),
loadWithdrawalHistory(),
loadTeamMembers()

]);

}


/* =====================================================
   SCHEDULES
===================================================== */

async function loadNormalSchedules(){

if(activationLocked)
return;

const c=
document.getElementById("normalSchedules");

if(!c)
return;

try{

const snap=
await getDocs(collection(db,"schedules"));

const a=[];

snap.forEach(d=>{

const x=d.data();

if(x.status==="active"){

a.push({

title:x.title||"Untitled Schedule",
description:x.description||"",
date:x.date||"",
time:x.time||""

});

}

});

a.sort(
(x,y)=>
new Date(
(x.date||"9999-12-31")+"T"+(x.time||"23:59")
)-
new Date(
(y.date||"9999-12-31")+"T"+(y.time||"23:59")
)
);

if(!a.length){

c.innerHTML=
'<div class="empty-state">📅 No active schedules available.</div>';

return;

}

c.innerHTML="";

a.forEach(s=>{

const item=document.createElement("div");

item.className="schedule-item";

let display=s.date;

if(s.date){

const d=
new Date(s.date+"T00:00:00");

if(!isNaN(d.getTime())){

display=
d.toLocaleDateString(
"en-GB",
{
day:"2-digit",
month:"short",
year:"numeric"
}
);

}

}

item.innerHTML=

'<div class="schedule-time">'+
escapeHtml(s.time||"--:--")+
'</div>'+

'<div style="flex:1">'+
'<strong>'+
escapeHtml(s.title)+
'</strong>'+
'<p>📅 '+
escapeHtml(display||"Date not set")+
'</p>'+
(
s.description
?
'<p>'+
escapeHtml(s.description)+
'</p>'
:
""
)+
"</div>";

c.appendChild(item);

});

}catch(e){

console.error(e);

c.innerHTML=
'<div class="error-state">⚠️ Unable to load schedules.</div>';

}

}


/* =====================================================
   TASKS
===================================================== */

async function loadTasks(){

if(activationLocked)
return;

const c=
document.getElementById("tasksContainer");

if(!c)
return;

try{

const snap=
await getDocs(collection(db,"tasks"));

c.innerHTML="";

if(snap.empty){

c.innerHTML=
'<div class="empty-state">📋 No tasks available right now.</div>';

return;

}

snap.forEach(d=>{

const x=d.data();

const title=x.title||"Task";

const desc=x.description||
"Complete this task.";

const reward=
Number(x.reward||0);

const card=document.createElement("div");

card.className="card";

card.innerHTML=
'<h3>📋 '+
escapeHtml(title)+
'</h3>'+
'<p>'+
escapeHtml(desc)+
'</p>'+
'<div class="reward">Reward: TSh '+
money(reward)+
'</div><br>'+
'<button class="action-btn">Complete Task</button>';

card.querySelector(".action-btn").onclick=()=>
creditActivityReward(
"task_"+d.id,
title,
reward
);

c.appendChild(card);

});

}catch(e){

console.error(e);

c.innerHTML=
'<div class="error-state">⚠️ Unable to load tasks.</div>';

}

}


/* =====================================================
   YOUTUBE
===================================================== */

function youtubeEmbed(url){

if(!url)
return "";

try{

const u=new URL(url);

let id="";

if(u.hostname.includes("youtu.be"))
id=u.pathname.slice(1);

else if(u.hostname.includes("youtube.com"))
id=
u.searchParams.get("v")||
u.pathname.split("/").pop();

return id
?
"https://www.youtube.com/embed/"+
encodeURIComponent(id)
:
url;

}catch{

return url;

}

}


/* =====================================================
   VIDEOS
===================================================== */

async function loadVideos(){

if(activationLocked)
return;

const c=
document.getElementById("videosContainer");

if(!c)
return;

try{

const snap=
await getDocs(collection(db,"videos"));

c.innerHTML="";

if(snap.empty){

c.innerHTML=
'<div class="empty-state">🎥 No videos available right now.</div>';

return;

}

snap.forEach(d=>{

const x=d.data();

const title=x.title||"Video";

const desc=x.description||
"Watch this video completely.";

const url=x.url||"";

const reward=
Number(x.reward||0);

const card=document.createElement("div");

card.className="card";

const embed=youtubeEmbed(url);

card.innerHTML=
'<h3>🎥 '+
escapeHtml(title)+
'</h3>'+
'<p>'+
escapeHtml(desc)+
'</p>'+
(
embed
?
'<iframe class="video-frame" src="'+
escapeHtml(embed)+
'" allowfullscreen></iframe>'
:
'<p style="margin-top:10px;color:#c33">Video URL is missing.</p>'
)+
'<div class="reward">Reward: TSh '+
money(reward)+
'</div><br>'+
'<button class="action-btn">Complete Video</button>';

card.querySelector(".action-btn").onclick=()=>
creditActivityReward(
"video_"+d.id,
title,
reward
);

c.appendChild(card);

});

}catch(e){

console.error(e);

c.innerHTML=
'<div class="error-state">⚠️ Unable to load videos.<br><small>Check Firestore videos collection.</small></div>';

}

}


/* =====================================================
   IMAGE ADS / POSTERS
===================================================== */

async function loadImageAds(){

if(activationLocked)
return;

const posters=
document.getElementById("postersContainer");

const ads=
document.getElementById("adsContainer");

try{

const snap=
await getDocs(collection(db,"imageAds"));

posters.innerHTML="";
ads.innerHTML="";

let pc=0;
let ac=0;

snap.forEach(d=>{

const x=d.data();

const image=x.imageUrl||"";

const reward=
Number(x.reward||0);

const type=
String(x.type||"").toLowerCase();

const isAd=
type.includes("ad")||
type.includes("like");

const card=document.createElement("div");

card.className="card";

if(isAd){

card.innerHTML=

(
image
?
'<img class="dynamic-image" src="'+
escapeHtml(image)+
'" alt="Like Ad">'
:
""
)+

'<div class="reward">Reward: TSh '+
money(reward)+
'</div><br>'+
'<button class="action-btn">👍 Like</button>';

card.querySelector(".action-btn").onclick=()=>
creditActivityReward(
"likead_"+d.id,
"Like Ad",
reward
);

ads.appendChild(card);

ac++;

}else{

const title=x.title||"Poster";

const desc=x.description||"";

card.innerHTML=

(
image
?
'<img class="dynamic-image" src="'+
escapeHtml(image)+
'" alt="'+
escapeHtml(title)+
'">'
:
""
)+

'<h3>'+
escapeHtml(title)+
'</h3>'+
(
desc
?
'<p>'+
escapeHtml(desc)+
'</p>'
:
""
)+
'<div class="reward">Reward: TSh '+
money(reward)+
'</div><br>'+
'<button class="action-btn">Complete</button>';

card.querySelector(".action-btn").onclick=()=>
creditActivityReward(
"poster_"+d.id,
title,
reward
);

posters.appendChild(card);

pc++;

}

});

if(pc===0)

posters.innerHTML=
'<div class="empty-state">🖼️ No posters available right now.</div>';

if(ac===0)

ads.innerHTML=
'<div class="empty-state">👍 No Like Ads available right now.</div>';

}catch(e){

console.error(e);

posters.innerHTML=
'<div class="error-state">⚠️ Unable to load posters.</div>';

ads.innerHTML=
'<div class="error-state">⚠️ Unable to load advertisements.</div>';

}

}


/* =====================================================
   TRAVEL QUIZ
===================================================== */

async function loadTravelQuizzes(){

if(activationLocked)
return;

const c=
document.getElementById("quizContainer");

if(!c)
return;

try{

const snap=
await getDocs(
collection(db,"travelQuizzes")
);

c.innerHTML="";

if(snap.empty){

c.innerHTML=
'<div class="empty-state">🌍 No travel quiz available right now.</div>';

return;

}

snap.forEach(d=>{

const x=d.data();

const q=
x.question||
"Question";

const opts=[

x.optionA||"",
x.optionB||"",
x.optionC||"",
x.optionD||""

];

const correct=
String(
x.correctAnswer||""
)
.trim()
.toUpperCase();

const reward=
Number(x.reward||0);

const card=
document.createElement("div");

card.className="card";

let h=
"<h3>🌍 Question</h3>"+
"<p>"+
escapeHtml(q)+
"</p>";

opts.forEach((o,i)=>{

const letter=
String.fromCharCode(65+i);

h+=
'<button type="button" class="option" data-answer="'+
letter+
'">'+
letter+
". "+
escapeHtml(o)+
"</button>";

});

card.innerHTML=h;

card.querySelectorAll(".option")
.forEach(b=>{

b.onclick=async()=>{

const selected=
String(
b.dataset.answer||""
)
.toUpperCase();

if(selected===correct){

await creditActivityReward(
"quiz_"+d.id,
q,
reward
);

}else{

openModal(
"Wrong Answer",
"That answer is not correct.",
"❌"
);

}

};

});

c.appendChild(card);

});

}catch(e){

console.error(
"Travel Quiz Error:",
e
);

c.innerHTML=
'<div class="error-state">⚠️ Unable to load travel quiz.</div>';

}

}


/* =====================================================
   SPIN WHEEL - CURRENT CYCLE
===================================================== */

async function loadSpinWheel(){

if(activationLocked)
return;

const c=
document.getElementById("spinContainer");

if(!c)
return;

try{

const snap=
await getDocs(
collection(db,"spinWheel")
);

const entries=[];

snap.forEach(d=>{

const x=d.data();

entries.push({

id:d.id,

name:x.name||"Reward",

amount:Number(x.amount||0),

probability:Number(x.probability||0),

/*
   NEW:
   Every reward in the same active Spin schedule
   must have the same cycleId.
*/
cycleId:
String(
x.cycleId||
""
).trim()

});

});


/*
   We use the first configured reward's cycleId
   as the current Spin cycle.

   Main Admin must give all rewards in the
   current schedule the same cycleId.
*/
const currentCycleId=
entries.length
?
String(
entries[0].cycleId||""
).trim()
:
"";


/*
   If rewards exist but no cycleId exists,
   do NOT fall back to the old lifetime system.
*/
if(entries.length && !currentCycleId){

c.innerHTML=

'<div class="card" style="text-align:center">'+

'<div style="font-size:90px;margin:20px">🎡</div>'+

'<h3>Spin Wheel</h3>'+

'<p style="color:#b45309;margin:12px 0">'+
'Spin schedule is not configured yet. Please wait for Main Admin to activate the current Spin schedule.'+
'</p>'+

'</div>';

return;

}


let spinAlreadyUsed=false;

if(currentUser && currentCycleId){

try{

const userSnap=
await getDoc(
doc(db,"users",currentUser.uid)
);

if(userSnap.exists()){

const userData=
userSnap.data();

spinAlreadyUsed=
String(
userData.spinCycleId||""
).trim()===currentCycleId;

}

}catch(userError){

console.error(
"Spin usage check",
userError
);

}

}


c.innerHTML=

'<div class="card" style="text-align:center">'+

'<div style="font-size:90px;margin:20px">🎡</div>'+

'<div class="reward">'+
(
entries.length
?
"Admin configured rewards"
:
"No rewards configured yet"
)+
'</div><br>'+

(
currentCycleId
?
'<p style="font-size:12px;color:#777;margin-bottom:10px">'+
'Current Spin Schedule: '+
escapeHtml(currentCycleId)+
'</p>'
:
""
)+

'<button id="firebaseSpinButton" class="action-btn" '+
(
spinAlreadyUsed
?
'disabled'
:
''
)+
'>'+
(
spinAlreadyUsed
?
'SPIN USED'
:
'SPIN NOW'
)+
'</button>'+

(
spinAlreadyUsed
?
'<p style="margin-top:12px;color:#777;font-size:13px">'+
'You have already used your Spin Wheel for this current schedule.'+
'</p>'
:
'<p style="margin-top:12px;color:#777;font-size:13px">'+
'You can spin once during this Spin schedule.'+
'</p>'
)+

'</div>';


const button=
document.getElementById(
"firebaseSpinButton"
);

if(button){

button.onclick=async()=>{

if(!requireActiveAccount())
return;

if(!entries.length){

openModal(
"Spin Wheel",
"No Spin Wheel rewards have been configured by Main Admin yet.",
"🎡"
);

return;

}

if(!currentCycleId){

openModal(
"Spin Wheel",
"Current Spin schedule is not configured yet.",
"⚠️"
);

return;

}


/*
   Fast UI pre-check.

   Firestore transaction inside
   creditSpinReward() is still the
   final protection.
*/
if(currentUser){

try{

const userSnap=
await getDoc(
doc(db,"users",currentUser.uid)
);

if(userSnap.exists()){

const userData=
userSnap.data();

if(
String(
userData.spinCycleId||""
).trim()===currentCycleId
){

button.disabled=true;
button.innerText="SPIN USED";

openModal(
"Spin Already Used",
"You have already used your Spin Wheel for this current schedule.",
"ℹ️"
);

return;

}

}

}catch(checkError){

console.error(
"Spin pre-check",
checkError
);

}

}

await spinFirebaseReward(
entries,
currentCycleId
);

};

}


/*
   Global Spin function.
*/
window.firebaseSpinWheel=async()=>{

if(!requireActiveAccount())
return;

if(!entries.length){

openModal(
"Spin Wheel",
"No rewards configured yet.",
"🎡"
);

return;

}

if(!currentCycleId){

openModal(
"Spin Wheel",
"Current Spin schedule is not configured yet.",
"⚠️"
);

return;

}

await spinFirebaseReward(
entries,
currentCycleId
);

};

}catch(e){

console.error(
"HASTAN GLOBE Spin Wheel:",
e
);

c.innerHTML=
'<div class="error-state">⚠️ Unable to load Spin Wheel.</div>';

}

}


async function spinFirebaseReward(
entries,
currentCycleId
){

if(!requireActiveAccount())
return{
ok:false
};

if(!currentUser){

openModal(
"Login Required",
"Please login before using Spin Wheel.",
"🔐"
);

return{
ok:false
};

}

if(!entries||!entries.length){

openModal(
"Spin Wheel",
"No rewards configured yet.",
"🎡"
);

return{
ok:false
};

}

currentCycleId=
String(currentCycleId||"").trim();

if(!currentCycleId){

openModal(
"Spin Wheel",
"Current Spin schedule is not configured yet.",
"⚠️"
);

return{
ok:false,
reason:"no_cycle"
};

}


const total=
entries.reduce(
(t,x)=>
t+
Math.max(0,x.probability),
0
);

if(total<=0){

openModal(
"Spin Wheel",
"The configured reward probabilities are invalid.",
"⚠️"
);

return{
ok:false
};

}

let r=Math.random()*total;

let selected=
entries[entries.length-1];

for(const x of entries){

r-=Math.max(0,x.probability);

if(r<=0){

selected=x;
break;

}

}


/*
   Make sure selected reward belongs
   to the current cycle.
*/
if(
String(selected.cycleId||"").trim()!==currentCycleId
){

openModal(
"Spin Wheel",
"The selected reward does not belong to the current Spin schedule.",
"⚠️"
);

return{
ok:false,
reason:"cycle_mismatch"
};

}


const button=
document.getElementById(
"firebaseSpinButton"
);

if(button){

button.disabled=true;
button.innerText="SPINNING...";

}


const result=
await creditSpinReward(
selected.amount,
selected.name,
currentCycleId
);


if(!result?.ok){

if(result?.already){

if(button){

button.disabled=true;
button.innerText="SPIN USED";

}

}else if(button){

button.disabled=false;
button.innerText="SPIN NOW";

}

}

return result;

}


/* =====================================================
   NORMAL NOTIFICATIONS
   REALTIME + UNREAD COUNT
===================================================== */

function updateNotificationBadge(count){

const badge=
document.getElementById("notificationBadge");

if(!badge)
return;

count=Number(count||0);

if(count<=0){

badge.innerText="0";
badge.style.display="none";

return;

}

badge.innerText=
count>99
?
"99+"
:
String(count);

badge.style.display="flex";

}


function getReadNotificationIdsFromUser(data){

const ids=
data?.readNotificationIds;

if(!Array.isArray(ids))
return new Set();

return new Set(
ids
.map(x=>String(x))
);

}


function getUnreadNotifications(){

return normalNotifications.filter(item=>{

return !readNotificationIds.has(
String(item.id)
);

});

}


function refreshNotificationBadge(){

if(!currentUser||activationLocked){

updateNotificationBadge(0);
return;

}

const unread=
getUnreadNotifications();

updateNotificationBadge(
unread.length
);

}


function renderNotifications(){

const c=
document.getElementById("notificationsContainer");

if(!c)
return;

if(activationLocked)
return;

c.innerHTML="";

if(!normalNotifications.length){

c.innerHTML=
'<div class="empty-state">🔔 No notifications available.</div>';

refreshNotificationBadge();

return;

}

const sorted=
[...normalNotifications].sort((a,b)=>{

const getTime=(x)=>{

try{

if(
x.createdAt &&
typeof x.createdAt.toMillis==="function"
){

return x.createdAt.toMillis();

}

if(
x.createdAt &&
typeof x.createdAt.toDate==="function"
){

return x.createdAt.toDate().getTime();

}

if(typeof x.createdAt==="number")
return x.createdAt;

if(typeof x.createdAt==="string"){

const t=
new Date(x.createdAt).getTime();

return isNaN(t)?0:t;

}

}catch(e){}

return 0;

};

return getTime(b)-getTime(a);

});


sorted.forEach(x=>{

const card=document.createElement("div");

const isUnread=
!readNotificationIds.has(
String(x.id)
);

card.className="card";

if(isUnread){

card.style.borderLeft=
"4px solid #e53935";

}

const title=
x.title||
"Notification";

const msg=
x.message||
x.description||
"";

const date=
formatNotificationDate(
x.createdAt
);

card.innerHTML=

'<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">'+

'<div style="flex:1">'+

'<h3>🔔 '+
escapeHtml(title)+
'</h3>'+

'<p>'+
escapeHtml(msg)+
'</p>'+

(
date
?
'<small style="display:block;margin-top:8px;color:#777">'+
escapeHtml(date)+
'</small>'
:
""
)+

'</div>'+

(
isUnread
?
'<span style="display:inline-flex;align-items:center;justify-content:center;background:#e53935;color:#fff;border-radius:20px;padding:4px 8px;font-size:11px;font-weight:700;white-space:nowrap">NEW</span>'
:
""
)+

'</div>';

c.appendChild(card);

});

refreshNotificationBadge();

}


function formatNotificationDate(value){

if(!value)
return "";

let date=null;

try{

if(
value &&
typeof value.toDate==="function"
){

date=value.toDate();

}else if(
value &&
typeof value.toMillis==="function"
){

date=new Date(value.toMillis());

}else if(value instanceof Date){

date=value;

}else if(typeof value==="number"){

date=new Date(value);

}else if(typeof value==="string"){

date=new Date(value);

}

}catch(e){

date=null;

}

if(!date||isNaN(date.getTime()))
return "";

return date.toLocaleString(
"en-GB",
{
day:"2-digit",
month:"short",
year:"numeric",
hour:"2-digit",
minute:"2-digit"
}
);

}


async function loadNotifications(){

if(activationLocked)
return;

const c=
document.getElementById("notificationsContainer");

if(!c)
return;

try{

if(currentUser){

try{

const userSnap=
await getDoc(
doc(db,"users",currentUser.uid)
);

if(userSnap.exists()){

const userData=userSnap.data();

readNotificationIds=
getReadNotificationIdsFromUser(
userData
);

}

}catch(userError){

console.warn(
"HASTAN GLOBE notification read-state load:",
userError
);

}

}

const snap=
await getDocs(
collection(db,"notifications")
);

normalNotifications=[];

snap.forEach(d=>{

normalNotifications.push({

id:d.id,
...d.data()

});

});

renderNotifications();

}catch(e){

console.error(
"HASTAN GLOBE loadNotifications:",
e
);

c.innerHTML=
'<div class="error-state">⚠️ Unable to load notifications.</div>';

updateNotificationBadge(0);

}

}

window.loadNotifications=loadNotifications;


function startNotificationListener(){

if(notificationsUnsubscribe){

notificationsUnsubscribe();
notificationsUnsubscribe=null;

}

if(!currentUser)
return;

if(activationLocked)
return;

try{

const notificationsRef=
collection(db,"notifications");

notificationsUnsubscribe=
onSnapshot(
notificationsRef,
snapshot=>{

normalNotifications=[];

snapshot.forEach(d=>{

normalNotifications.push({

id:d.id,
...d.data()

});

});

renderNotifications();

console.log(
"HASTAN GLOBE: Notifications updated realtime."
);

},
error=>{

console.error(
"HASTAN GLOBE notification realtime listener:",
error
);

}

);

}catch(e){

console.error(
"HASTAN GLOBE startNotificationListener:",
e
);

}

}


function startNotificationUserListener(){

if(notificationUserUnsubscribe){

notificationUserUnsubscribe();
notificationUserUnsubscribe=null;

}

if(!currentUser)
return;

if(activationLocked)
return;

try{

const userRef=
doc(
db,
"users",
currentUser.uid
);

notificationUserUnsubscribe=
onSnapshot(
userRef,
snapshot=>{

if(!snapshot.exists()){

readNotificationIds=
new Set();

refreshNotificationBadge();

return;

}

const data=snapshot.data();

currentUserData={
...(currentUserData||{}),
...data
};

readNotificationIds=
getReadNotificationIdsFromUser(
data
);

renderNotifications();

},
error=>{

console.error(
"HASTAN GLOBE notification user listener:",
error
);

}

);

}catch(e){

console.error(
"HASTAN GLOBE startNotificationUserListener:",
e
);

}

}


function stopNotificationListeners(){

if(notificationsUnsubscribe){

notificationsUnsubscribe();
notificationsUnsubscribe=null;

}

if(notificationUserUnsubscribe){

notificationUserUnsubscribe();
notificationUserUnsubscribe=null;

}

normalNotifications=[];
readNotificationIds=
new Set();

updateNotificationBadge(0);

}


window.markNotificationsAsRead=
async function(){

if(!currentUser)
return;

if(activationLocked)
return;

if(!normalNotifications.length)
return;

const unreadIds=
normalNotifications
.map(x=>String(x.id))
.filter(id=>!readNotificationIds.has(id));

if(!unreadIds.length){

refreshNotificationBadge();

return;

}

try{

const userRef=
doc(
db,
"users",
currentUser.uid
);

await setDoc(
userRef,
{
readNotificationIds:
arrayUnion(...unreadIds)
},
{
merge:true
}
);

unreadIds.forEach(id=>{

readNotificationIds.add(id);

});

renderNotifications();

console.log(
"HASTAN GLOBE: Notifications marked as read:",
unreadIds.length
);

}catch(e){

console.error(
"HASTAN GLOBE markNotificationsAsRead:",
e
);

}

};


window.getUnreadNotificationCount=
function(){

return getUnreadNotifications().length;

};


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
auth,
async user=>{

currentUser=user;

updateSettingsUI(user);

if(balanceUnsubscribe){

balanceUnsubscribe();
balanceUnsubscribe=null;

}

if(gamerBalanceUnsubscribe){

gamerBalanceUnsubscribe();
gamerBalanceUnsubscribe=null;

}

stopNotificationListeners();


if(!user){

activationLocked=false;

const activation=
document.getElementById("activationScreen");

if(activation)
activation.classList.remove("show");

stopWithdrawalHistoryListener();

localStorage.removeItem("normal_user");
localStorage.removeItem("normal_user_uid");

showLoginMessages();

return;

}


/* =====================================================
   ADMIN BYPASS
===================================================== */

if(isAdminUser(user)){

activationLocked=false;

const activation=
document.getElementById("activationScreen");

if(activation)
activation.classList.remove("show");

stopWithdrawalHistoryListener();

redirectAdminUser(user);

return;

}


/* =====================================================
   NORMAL USER
===================================================== */

try{

const data=
await ensureUserProfile(user);

currentUserData=data;

const active=
isAccountActive(data);

if(!active){

showActivationScreen(data);

updateActivationStatusUI(
normalizeActivationStatus(data)
);

localStorage.setItem(
"normal_user",
"true"
);

localStorage.setItem(
"normal_user_uid",
user.uid
);

return;

}


/* =====================================================
   ACTIVE USER
===================================================== */

hideActivationScreen();

writeUserUi(data);

await ensureGamerBalance(user);

await window.updateGamerBalance();

listenToUserBalance(user);

listenToGamerBalance(user);

startWithdrawalHistoryListener(user);

await loadAllFirebaseContent();

startNotificationListener();
startNotificationUserListener();

localStorage.setItem(
"normal_user",
"true"
);

localStorage.setItem(
"normal_user_uid",
user.uid
);

}catch(e){

console.error(
"Profile setup error",
e
);

openModal(
"Account Error",
"Unable to load your account data right now.",
"⚠️"
);

}

});


console.log(
"HASTAN GLOBE Firebase dashboard connection loaded."
);

console.log(
"HASTAN GLOBE activation protection loaded."
);

console.log(
"HASTAN GLOBE Payment Admin activation gate loaded."
);

console.log(
"HASTAN GLOBE role protection loaded."
);

console.log(
"HASTAN GLOBE withdrawal history loaded."
);

console.log(
"HASTAN GLOBE lifetime Net Profit system loaded."
);

console.log(
"HASTAN GLOBE CYCLE-BASED SPIN PROTECTION loaded."
);

console.log(
"HASTAN GLOBE REFERRAL CODE LINK SYSTEM loaded."
);

console.log(
"HASTAN GLOBE FIRESTORE USERNAME SYSTEM LOADED."
);

console.log(
"HASTAN GLOBE TEAM SYSTEM LOADED."
);

console.log(
"HASTAN GLOBE REALTIME NOTIFICATION SYSTEM LOADED."
);


/* =====================================================
   HASTAN GLOBE - MICHAEL DEMO CHAT
   SAFE VERSION
===================================================== */

(function () {

  let paid = false;
  let balance = 256000;


  /* ===================================================
     OPEN MICHAEL CHAT
  =================================================== */

  function HGMichaelOpenChat() {

    const page =
      document.getElementById("michaelChatPage");

    if (!page) {
      console.error("michaelChatPage not found");
      return;
    }

    const pages =
      document.querySelectorAll(
        "#normalApp .page"
      );

    pages.forEach(function (p) {
      p.style.display = "none";
    });

    page.style.display = "block";

    window.scrollTo({
      top: 0,
      behavior: "instant"
    });

    setTimeout(function () {

      window.scrollTo({
        top: 0,
        behavior: "instant"
      });

      const input =
        document.getElementById(
          "michaelMessageInput"
        );

      if (input) {
        input.focus();
      }

    }, 100);

  }


  /* ===================================================
     CLOSE MICHAEL CHAT
  =================================================== */

  function HGMichaelCloseChat() {

    const chatPage =
      document.getElementById(
        "michaelChatPage"
      );

    if (chatPage) {
      chatPage.style.display = "none";
    }

    const pages =
      document.querySelectorAll(
        "#normalApp .page"
      );

    pages.forEach(function (page) {
      page.style.display = "none";
    });

    let homePage =
      document.getElementById("homePage");

    if (!homePage) {
      homePage =
        document.getElementById("home");
    }

    if (!homePage) {
      homePage =
        document.querySelector(
          "#normalApp .page:first-of-type"
        );
    }

    if (homePage) {

      homePage.style.display = "block";

    }

    window.scrollTo({
      top: 0,
      behavior: "instant"
    });

  }


  /* ===================================================
     UPDATE BALANCE
  =================================================== */

  function HGMichaelUpdateBalance() {

    const balanceElement =
      document.getElementById(
        "michaelChatBalance"
      );

    if (balanceElement) {

      balanceElement.textContent =
        "TSh " +
        balance.toLocaleString();

    }

  }


  /* ===================================================
     ESCAPE MESSAGE TEXT
  =================================================== */

  function HGMichaelEscape(text) {

    const div =
      document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

  }


  /* ===================================================
     ADD MESSAGE
  =================================================== */

  function HGMichaelAddMessage(
    message,
    sender
  ) {

    const box =
      document.getElementById(
        "michaelMessages"
      );

    if (!box) return;

    const row =
      document.createElement("div");

    if (sender === "user") {

      row.style.cssText =
        "display:flex;" +
        "justify-content:flex-end;" +
        "margin-bottom:12px;";

      row.innerHTML =

        '<div style="' +

        'background:#19a463;' +
        'color:white;' +
        'padding:10px 13px;' +
        'border-radius:13px;' +
        'max-width:78%;' +
        'word-wrap:break-word;' +

        '">' +

        HGMichaelEscape(message) +

        "</div>";

    }

    else {

      row.style.cssText =
        "display:flex;" +
        "gap:8px;" +
        "margin-bottom:12px;";

      row.innerHTML =

        '<img ' +

        'src="https://randomuser.me/api/portraits/men/46.jpg" ' +

        'style="' +
        'width:36px;' +
        'height:36px;' +
        'border-radius:50%;' +
        'object-fit:cover;' +
        'flex-shrink:0;' +
        '">' +

        '<div style="' +

        'background:white;' +
        'padding:10px 13px;' +
        'border-radius:13px;' +
        'max-width:78%;' +
        'box-shadow:0 2px 5px rgba(0,0,0,.06);' +
        'word-wrap:break-word;' +

        '">' +

        HGMichaelEscape(message) +

        "</div>";

    }

    box.appendChild(row);

    setTimeout(function () {

      window.scrollTo({
        top:
          document.body.scrollHeight,
        behavior: "smooth"
      });

    }, 50);

  }


  /* ===================================================
     MICHAEL REPLY
  =================================================== */

  function HGMichaelReply(message) {

    const lower =
      message.toLowerCase();

    if (
      lower.includes("hello") ||
      lower.includes("hi")
    ) {

      return "Hello habari Tanzania 👋";

    }

    if (
      lower.includes("tanzania")
    ) {

      return "Tanzania inaonekana nchi nzuri sana 😊";

    }

    if (
      lower.includes("kiswahili") ||
      lower.includes("swahili")
    ) {

      return "Sawa kabisa 😊 nataka kujifunza sana sana Kiswahili.";

    }

    if (
      lower.includes("walimu")
    ) {

      return "Visuri kidogo, walimu hakuna huku.";

    }

    if (
      lower.includes("nzuri")
    ) {

      return "Nafurahi kusikia hivyo 😊";

    }

    return "That's nice 😊 Tell me more about Tanzania.";

  }


  /* ===================================================
     SEND MESSAGE
  =================================================== */

  function HGMichaelSendMessage() {

    const input =
      document.getElementById(
        "michaelMessageInput"
      );

    if (!input) return;

    const message =
      input.value.trim();

    if (!message) return;

    HGMichaelAddMessage(
      message,
      "user"
    );

    input.value = "";

    setTimeout(function () {

      const reply =
        HGMichaelReply(message);

      HGMichaelAddMessage(
        reply,
        "michael"
      );

      if (!paid) {

        setTimeout(function () {

          HGMichaelPay();

        }, 1200);

      }

    }, 1200);

  }


  /* ===================================================
     PAYMENT
  =================================================== */

  function HGMichaelPay() {

    if (paid) return;

    paid = true;

    const payment =
      75000;

    balance +=
      payment;

    HGMichaelUpdateBalance();

    HGMichaelAddMessage(

      "🎉 Congratulations! Michael has paid you TSh " +
      payment.toLocaleString() +
      " 💰",

      "michael"

    );

    setTimeout(function () {

      if (
        typeof window.openModal === "function"
      ) {

        window.openModal(

          "Payment Received",

          "🎉 Congratulations! You have been paid by Michael TSh 75,000. Your balance is now TSh " +
          balance.toLocaleString() +
          ".",

          "💰"

        );

      }

    }, 700);

  }


  /* ===================================================
     GLOBAL FUNCTIONS FOR HTML
  =================================================== */

  window.openMichaelChat =
    HGMichaelOpenChat;

  window.closeMichaelChat =
    HGMichaelCloseChat;

  window.sendMichaelMessage =
    HGMichaelSendMessage;

  window.payMichaelDemo =
    HGMichaelPay;

})();