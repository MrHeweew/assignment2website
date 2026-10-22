/* ==========================================================
   articles.js
   AJAX: fetches data/articles.json and builds a card for each.
   To add an article, add an object to that JSON file
   (title, tag, date, text).
   If AJAX is blocked (page opened by double-click, no web server)
   we use the BACKUP copy below, so the page is never empty.
   ========================================================== */

/* Same content as data/articles.json. Keep both in sync. */
const BACKUP = [
  {title:'Understanding Your Rights as a Tenant', tag:'Tenancy', date:'20 October 2026', text:'A plain-language overview of what tenants and landlords can expect from a lease: deposits, repairs, notice periods, and what to do when a dispute starts.'},
  {title:'What to Expect in an International Arbitration', tag:'Arbitration', date:'13 October 2026', text:'How arbitration differs from a court case: choosing the arbitrators, the main stages of the procedure, timelines, costs, and how an award is enforced across borders.'},
  {title:'Drafting Contracts That Protect You', tag:'Contracts', date:'6 October 2026', text:'Five clauses worth checking before you sign: scope, payment, termination, liability and dispute resolution, and why clear drafting prevents costly disputes later.'}
];

/* Turn the list into cards */
const renderArticles = list => { $('#articles').html(list.map((a, i) =>
  `<article class="art reveal"><img src="images/article-${i % 3 + 1}.webp" width="900" height="560" alt="" loading="lazy">
     <div><span class="tag">${a.tag}</span><h3>${a.title}</h3><p>${a.text}</p></div><time>${a.date}</time></article>`).join('')); if(SITE.reveal) SITE.reveal(); };   // cards arrive after page setup: tell the reveal observer about them

/* Runs on first load and after every page change (see nav.js) */
SITE.pageInits.push(function(){
  if(!$('#articles').length) return;
  if(location.protocol === 'file:') return renderArticles(BACKUP);   // no web server: AJAX would be blocked
  $.getJSON('data/articles.json')
    .done(renderArticles)
    .fail(() => renderArticles(BACKUP));
});
