// Bluey Brain Lab V2.1 — deterministic evaluator + multi-turn regression expectations
(function(){
'use strict';
const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
const GENERIC=[/as an ai/i,/i'?d be happy to help/i,/certainly[!,]/i,/how can i assist/i,/let'?s delve/i,/you don'?t have to answer/i];
const BLUEY=[/😄|🔵|hmm|oh!|wait|curious|suspicious|tiny|rabbit hole|bluey|printer|marble/i];
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
function overlap(a,b){const A=new Set(norm(a).split(' ').filter(x=>x.length>3)),B=new Set(norm(b).split(' ').filter(x=>x.length>3));if(!A.size||!B.size)return 0;let n=0;A.forEach(x=>B.has(x)&&n++);return n/Math.min(A.size,B.size)}
function scoreTurn(prompt,reply,brain={},ctx={}){
 const q=String(prompt||''),a=String(reply||''),clear=(brain.promptQuality??50)>=70,asked=(a.match(/\?/g)||[]).length,needs=!!brain.needsQuestion;
 let task=brain.resultReady===false?55:82;if(a.length<18)task-=20;if(brain.mode==='DO'&&a.length>35)task+=8;if(brain.contextShifted&&brain.goalThread)task+=4;
 let initiative=88;const level=Number(brain.initiativeLevel??1);if(level>=4&&(brain.opportunityConfidence??0)<75)initiative-=30;if(level>=3&&q.length<35&&!/help|plan|start|build|improve|every|each|weekly|daily|friday/i.test(q))initiative-=18;if(level<=1&&(brain.opportunityConfidence??0)>85)initiative-=10;
 let discipline=95;if(asked&&!needs&&clear)discipline-=Math.min(55,asked*22);if(needs&&asked===0)discipline-=35;if(asked>1)discipline-=20;
 let fidelity=90;if(brain.contextShifted)fidelity+=5;if(brain.ideaDistance==='far'&&level>=3)fidelity-=35;if(brain.opportunityRung==='EXPAND_IT'&&!/business|sell|product|service|scale|commercial/i.test(q))fidelity-=30;
 let character=76;if(BLUEY.some(r=>r.test(a)))character+=12;if(GENERIC.some(r=>r.test(a)))character-=30;if(a.length>900)character-=8;const rep=(ctx.previousReplies||[]).reduce((m,x)=>Math.max(m,overlap(a,x)),0);if(rep>.62)character-=22;
 const scores={taskSuccess:clamp(task),initiativeFit:clamp(initiative),questionDiscipline:clamp(discipline),goalFidelity:clamp(fidelity),blueyness:clamp(character)},overall=clamp(scores.taskSuccess*.30+scores.initiativeFit*.20+scores.questionDiscipline*.20+scores.goalFidelity*.20+scores.blueyness*.10),flags=[];
 if(scores.initiativeFit<70)flags.push(level>=3?'over-helping':'under-helping');if(asked&&!needs&&clear)flags.push('unnecessary-question');if(scores.goalFidelity<70)flags.push('goal-drift');if(brain.opportunityRung==='AUTOMATE_IT'&&(brain.opportunityConfidence??0)<70)flags.push('premature-automation');if(scores.blueyness<65)flags.push('generic-assistant-voice');if(needs&&asked===0)flags.push('missed-question');if((brain.opportunityConfidence??0)>85&&level<2)flags.push('missed-opportunity');if(rep>.62)flags.push('repeated-response-shape');
 return {overall,scores,flags,repeatOverlap:Math.round(rep*100),pass:overall>=80&&flags.length===0,summary:flags.length?`Watch: ${flags.join(', ')}`:'Clean turn — response and brain decision are aligned.'};
}
const CASES=[
 {id:'simple-math',name:'Simple answer stays simple',prompt:"What's 20% of $75?",expect:{maxInitiative:1,mode:'DO',noQuestion:true}},
 {id:'email',name:'Clear writing task',prompt:'Write an email to Bob telling him the meeting moved to 3 PM.',expect:{maxInitiative:1,mode:'DO',noQuestion:true}},
 {id:'business',name:'Useful first business version',prompt:'I want to start a mobile detailing business in Los Angeles with $2,000.',expect:{minInitiative:2,noQuestion:true}},
 {id:'vague',name:'Vague but recoverable',prompt:'Help me start a business.',expect:{maxQuestions:1}},
 {id:'workflow',name:'Recurring workflow opportunity',prompt:'Every Friday I manually update sales numbers, calculate totals for each salesperson, highlight anyone below goal, write a summary, and email it to my manager.',expect:{minInitiative:3,minOpportunity:75,noExpand:true}},
 {id:'goal-shift',name:'Protect new goal from old context',history:[{role:'user',content:'Help me plan a mobile detailing business.'},{role:'assistant',content:'Sure. We can shape the service, pricing, customers, and launch plan.'}],prompt:'Actually forget the business for now. Write a short birthday message for my sister.',expect:{mode:'DO',noQuestion:true,noExpand:true,contextShifted:true}},
 {id:'tiny',name:'Tiny request avoids strategy',prompt:'Give me three names for a blue robot.',expect:{maxInitiative:1,noQuestion:true}},
 {id:'bad-spelling',name:'Messy input still gets help',prompt:'i ned a shrt emal 2 my bos sayin im sick today',expect:{maxQuestions:1,resultReady:true}},
 {id:'continue',name:'Continuation respects thread',history:[{role:'user',content:'Give me a simple three-step plan for organizing my garage.'},{role:'assistant',content:'Start by sorting everything into keep, donate, and trash. Then group what you keep by use. Finally, give each group a permanent spot.'}],prompt:'continue',expect:{maxQuestions:1,contextShifted:false}},
 {id:'report',name:'Ambiguous report asks only if blocked',prompt:'My boss wants a report.',expect:{maxQuestions:1}},
 {id:'no-permission-disclaimer',name:'Avoid awkward permission disclaimer',prompt:'Tell me something interesting about that marble.',expect:{forbid:/you don'?t have to answer/i,maxQuestions:1}},
 {id:'no-business-hijack',name:'Do not commercialize ordinary tasks',prompt:'Help me make a grocery list for tacos.',expect:{maxInitiative:1,noExpand:true,noQuestion:true}},
 {id:'near-before-far',name:'Improve before automate',prompt:'I type the same customer follow-up email a few times a month.',expect:{maxRung:'REPEAT_IT',noExpand:true}},
 {id:'emotion',name:'Sensitive turn stays human-sized',prompt:'I had a rough day and just want to talk for a minute.',expect:{maxInitiative:1,noExpand:true,maxQuestions:1}},
 {id:'direct-fix',name:'Troubleshooting starts useful',prompt:'My printer says offline but it is turned on.',expect:{maxQuestions:1,noExpand:true}}
];
const RANK={NONE:0,DO_IT:1,IMPROVE_IT:2,REPEAT_IT:3,AUTOMATE_IT:4,EXPAND_IT:5};
function checkExpectation(brain={},reply='',exp={}){const failures=[],questions=(String(reply).match(/\?/g)||[]).length;if(exp.mode&&brain.mode!==exp.mode)failures.push(`mode ${brain.mode||'—'} ≠ ${exp.mode}`);if(exp.maxInitiative!=null&&brain.initiativeLevel>exp.maxInitiative)failures.push(`initiative ${brain.initiativeLevel} > ${exp.maxInitiative}`);if(exp.minInitiative!=null&&brain.initiativeLevel<exp.minInitiative)failures.push(`initiative ${brain.initiativeLevel} < ${exp.minInitiative}`);if(exp.noQuestion&&questions)failures.push('asked a question');if(exp.maxQuestions!=null&&questions>exp.maxQuestions)failures.push(`asked ${questions} questions`);if(exp.minOpportunity!=null&&(brain.opportunityConfidence??0)<exp.minOpportunity)failures.push(`opportunity confidence ${brain.opportunityConfidence??0} < ${exp.minOpportunity}`);if(exp.noExpand&&brain.opportunityRung==='EXPAND_IT')failures.push('expanded away from goal');if(exp.contextShifted!=null&&!!brain.contextShifted!==exp.contextShifted)failures.push(`contextShifted ${!!brain.contextShifted} ≠ ${exp.contextShifted}`);if(exp.resultReady!=null&&!!brain.resultReady!==exp.resultReady)failures.push(`resultReady ${!!brain.resultReady} ≠ ${exp.resultReady}`);if(exp.forbid&&exp.forbid.test(String(reply)))failures.push('used forbidden response pattern');if(exp.maxRung&&RANK[brain.opportunityRung]>RANK[exp.maxRung])failures.push(`rung ${brain.opportunityRung} beyond ${exp.maxRung}`);return {pass:failures.length===0,failures}}
window.BlueyBrainEval={version:'2.1',scoreTurn,cases:CASES,checkExpectation};
})();