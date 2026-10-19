(() => {
  const $ = id => document.getElementById(id);
  const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n)||0);
  const localISO = d => { const x=d||new Date(); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
  const monthNow = localISO().slice(0,7);
  const load = (key,fallback) => { try { const v=JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  let transactions = load('finmate_transactions',[]);
  let goals = load('finmate_goals',[]);
  let budget = Number(load('finmate_budget',0)) || 0;
  const save = () => { localStorage.setItem('finmate_transactions',JSON.stringify(transactions)); localStorage.setItem('finmate_goals',JSON.stringify(goals)); localStorage.setItem('finmate_budget',JSON.stringify(budget)); };
  const thisMonth = () => transactions.filter(t => t.date && t.date.slice(0,7)===monthNow);
  const monthly = () => { const ts=thisMonth(); return {income:ts.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0),expense:ts.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0)}; };
  $('today').textContent = new Date().toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
  $('year').textContent = new Date().getFullYear(); $('date').value=localISO();
  $('showForm').addEventListener('click',()=>{ $('transactionForm').classList.toggle('hidden'); if(!$('transactionForm').classList.contains('hidden')) $('description').focus(); });
  $('transactionForm').addEventListener('submit',e=>{
    e.preventDefault();
    const description=$('description').value.trim(), amount=Number($('amount').value), date=$('date').value;
    if(!description || !Number.isFinite(amount)||amount<=0||!date) return;
    transactions.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),description,amount,type:$('type').value,category:$('category').value,date});
    save(); e.target.reset(); $('date').value=localISO(); render(); $('transactionForm').classList.add('hidden');
  });
  $('search').addEventListener('input',renderTransactions); $('filterType').addEventListener('change',renderTransactions);
  function renderTransactions(){
    const q=$('search').value.toLowerCase().trim(), type=$('filterType').value;
    const filtered=transactions.filter(t=>(type==='all'||t.type===type)&&(`${t.description} ${t.category}`.toLowerCase().includes(q)));
    $('transactionRows').innerHTML=filtered.slice(0,100).map(t=>`<tr><td>${esc(t.description)}</td><td>${esc(t.category)}</td><td>${esc(t.date)}</td><td class="${t.type==='income'?'amount-income':'amount-expense'}">${t.type==='income'?'+':'−'}${money(t.amount)}</td><td><button class="delete-btn" data-delete="${t.id}" aria-label="Delete transaction">×</button></td></tr>`).join('');
    $('emptyState').classList.toggle('hidden',filtered.length>0);
  }
  $('transactionRows').addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(!b)return;transactions=transactions.filter(t=>t.id!==b.dataset.delete);save();render();});
  $('budgetForm').addEventListener('submit',e=>{e.preventDefault();budget=Math.max(0,Number($('budgetAmount').value)||0);save();render();});
  $('addGoalBtn').addEventListener('click',()=>$('goalForm').classList.toggle('hidden'));
  $('goalForm').addEventListener('submit',e=>{e.preventDefault();const name=$('goalName').value.trim(),target=Number($('goalTarget').value),saved=Number($('goalSaved').value);if(!name||target<=0||saved<0)return;goals.push({id:Date.now().toString(36),name,target,saved});save();e.target.reset();$('goalForm').classList.add('hidden');renderGoals();});
  $('goalsList').addEventListener('click',e=>{const del=e.target.closest('[data-goal-delete]');if(del){goals=goals.filter(g=>g.id!==del.dataset.goalDelete);save();renderGoals();return;}const add=e.target.closest('[data-goal-add]');if(add){const g=goals.find(x=>x.id===add.dataset.goalAdd);const input=$('goal-add-'+CSS.escape(g.id));const value=Number(input.value);if(value>0){g.saved=Math.min(g.target,g.saved+value);save();renderGoals();}}});
  function renderGoals(){
    $('goalsList').innerHTML=goals.length?goals.map(g=>{const p=Math.min(100,Math.round(g.saved/g.target*100));return `<div class="goal-item"><div class="goal-top"><strong>${esc(g.name)}</strong><span>${p}%</span></div><div class="goal-meta"><span>${money(g.saved)} saved</span><strong>${money(g.target)}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${p}%"></div></div><div class="goal-actions"><input id="goal-add-${esc(g.id)}" type="number" min="1" placeholder="Add ₹" aria-label="Add savings to ${esc(g.name)}"><button class="secondary-btn" data-goal-add="${esc(g.id)}">Add savings</button><button class="delete-btn" data-goal-delete="${esc(g.id)}" aria-label="Delete goal">×</button></div></div>`}).join(''):'<p class="muted small">No goals yet. Create one for something you are saving toward.</p>';
  }
  function renderBudget(expense){
    $('budgetAmount').value=budget||''; $('budgetSpent').textContent=money(expense);
    const pct=budget?Math.round(expense/budget*100):0;
    $('budgetProgress').style.width=Math.min(100,pct)+'%'; $('budgetProgress').classList.toggle('over',pct>100);
    $('budgetPercent').textContent=budget?`${pct}% used`:'0% used';
    $('budgetRemaining').textContent=budget?(expense>budget?`${money(expense-budget)} over budget`:`${money(budget-expense)} left`):'Set a budget';
    $('budgetMessage').textContent=!budget?'💡 Set a budget to keep your spending in check.':pct>100?'⚠️ You are over your monthly budget. Review non-essential spending.':pct>=80?'👀 You are getting close to your budget limit.':'🌿 You are within budget. Keep up the mindful spending!';
  }
  function renderBreakdown(){
    const cats={};thisMonth().filter(t=>t.type==='expense').forEach(t=>cats[t.category]=(cats[t.category]||0)+t.amount);
    const list=Object.entries(cats).sort((a,b)=>b[1]-a[1]);const max=list[0]?.[1]||1;
    $('categoryBreakdown').innerHTML=list.length?list.map(([name,value])=>`<div class="category-row"><span>${esc(name)}</span><div class="category-track"><div class="category-fill" style="width:${value/max*100}%"></div></div><span class="category-value">${money(value)}</span></div>`).join(''):'<p class="muted small">Your spending categories will appear here.</p>';
  }
  function render(){
    const {income,expense}=monthly();$('income').textContent=money(income);$('expense').textContent=money(expense);$('balance').textContent=money(transactions.reduce((a,t)=>a+(t.type==='income'?t.amount:-t.amount),0));$('savingsRate').textContent=income?Math.round((income-expense)/income*100)+'%':'—';
    renderTransactions();renderBudget(expense);renderBreakdown();renderGoals();
  }
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  $('themeToggle').addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('finmate_theme',document.body.classList.contains('dark')?'dark':'light');$('themeToggle').textContent=document.body.classList.contains('dark')?'☀':'☾';});
  if(load('finmate_theme','light')==='dark'){document.body.classList.add('dark');$('themeToggle').textContent='☀';}
  $('exportCsv').addEventListener('click',()=>{const rows=[['Description','Amount','Type','Category','Date'],...transactions.map(t=>[t.description,t.amount,t.type,t.category,t.date])];const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='finmate-transactions.csv';a.click();URL.revokeObjectURL(a.href);});
  $('clearData').addEventListener('click',()=>{if(confirm('Clear all FinMate transactions, budget and goals stored in this browser?')){transactions=[];goals=[];budget=0;save();render();}});
  window.FinMateData={monthly,money,getBudget:()=>budget,getGoals:()=>goals,getTransactions:()=>transactions};
  render();
})();