(() => {
  const form=document.getElementById('chatForm'), input=document.getElementById('chatInput'), messages=document.getElementById('chatMessages');
  const add=(text,who='bot')=>{const div=document.createElement('div');div.className='chat-bubble '+who;div.textContent=text;messages.appendChild(div);messages.scrollTop=messages.scrollHeight;};
  function reply(text){
    const q=text.toLowerCase(), data=window.FinMateData, m=data.monthly(), budget=data.getBudget(), goals=data.getGoals();
    if(/summary|overview|balance|income|expense|spend/.test(q))return `This month: income ${data.money(m.income)}, expenses ${data.money(m.expense)}. Overall balance from all recorded transactions is ${data.money(data.getTransactions().reduce((s,t)=>s+(t.type==='income'?t.amount:-t.amount),0))}.`;
    if(/budget|limit/.test(q))return budget?`You have spent ${data.money(m.expense)} of your ${data.money(budget)} monthly budget. ${m.expense>budget?'You are over your limit. Consider reviewing optional expenses.':`You have ${data.money(budget-m.expense)} left.`}`:'You have not set a monthly budget yet. Use the Monthly budget card to add one.';
    if(/goal|saving|save/.test(q))return goals.length?`You have ${goals.length} savings goal(s). ${goals.map(g=>`${g.name}: ${Math.min(100,Math.round(g.saved/g.target*100))}% complete`).join('; ')}. Try saving a small, regular amount when possible.`:'Create a savings goal and choose a realistic target. Small, consistent contributions can help.';
    if(/tip|advice|help|suggest/.test(q))return 'Try these habits: review subscriptions, plan purchases before shopping, set a realistic monthly spending limit, and build savings gradually. Prioritize essentials and avoid sharing sensitive financial details online.';
    if(/hello|hi|hey/.test(q))return 'Hello! Ask me for your monthly summary, budget status, or savings tips.';
    return 'I can help with your transaction summary, monthly budget, savings goals, and general saving habits. Try asking “My summary” or “Budget status”.';
  }
  form.addEventListener('submit',e=>{e.preventDefault();const text=input.value.trim();if(!text)return;add(text,'user');input.value='';add(reply(text));});
  document.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>{const p=b.dataset.prompt;add(b.textContent,'user');add(reply(p==='summary'?'my summary':p==='budget'?'budget status':'saving tips'));}));
})();