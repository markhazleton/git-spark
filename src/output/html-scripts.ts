/**
 * Client-side JavaScript for Git Spark HTML reports
 *
 * Provides theme toggling, table sorting, pagination, and back-to-top functionality
 * as a single self-contained IIFE. Content is hashed for CSP compliance —
 * any change to this string must trigger a CSP hash update in html.ts.
 */
export function getBasicScript(): string {
  return `(() => {
      const backBtn = document.getElementById('backToTop');
      const root = document.documentElement;
      const themeToggle = document.getElementById('themeToggle');
      const savedTheme = localStorage.getItem('gitSparkTheme');
      
      if (savedTheme === 'dark') {
        root.classList.add('dark');
        themeToggle?.setAttribute('aria-pressed','true');
        if (themeToggle) themeToggle.textContent = '☀️';
      }
      
      themeToggle?.addEventListener('click', () => {
        const isDark = root.classList.toggle('dark');
        themeToggle?.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        if (themeToggle) themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('gitSparkTheme', isDark ? 'dark' : 'light');
      });
      
      window.addEventListener('scroll', () => {
        if (window.scrollY > 300) backBtn?.removeAttribute('hidden'); 
        else backBtn?.setAttribute('hidden','');
      });
      
      backBtn?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
      
      function makeSortable(){
        document.querySelectorAll('table[data-sortable]')?.forEach(table => {
          table.querySelectorAll('th')?.forEach((th, idx) => {
            th.addEventListener('click', () => {
              const tbody = table.querySelector('tbody');
              if(!tbody) return;
              const rows = Array.from(tbody.querySelectorAll('tr'));
              const dir = th.getAttribute('data-sort-dir') === 'asc' ? 'desc' : 'asc';
              table.querySelectorAll('th').forEach(h => h.removeAttribute('aria-sort'));
              th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
              th.setAttribute('data-sort-dir', dir);
              rows.sort((a,b) => {
                const av = (a.querySelectorAll('td')[idx] || {}).getAttribute?.('data-sort') || '0';
                const bv = (b.querySelectorAll('td')[idx] || {}).getAttribute?.('data-sort') || '0';
                const na = parseFloat(av); const nb = parseFloat(bv);
                if(!isNaN(na) && !isNaN(nb)) return dir==='asc'? na-nb : nb-na;
                return dir==='asc'? av.localeCompare(bv) : bv.localeCompare(av);
              });
              rows.forEach(r => tbody.appendChild(r));
              const live = document.getElementById('liveRegion');
              if(live) live.textContent = 'Sorted column ' + th.innerText + ' ' + dir;
            });
          });
        });
      }
      
      function initPagination(){
        document.querySelectorAll('table[data-initial-limit]')?.forEach(table => {
          const limit = parseInt(table.dataset.initialLimit || '0');
          if(!limit) return;
          const rows = Array.from(table.querySelectorAll('tbody tr'));
          if(rows.length <= limit) return;
          rows.slice(limit).forEach(r => r.classList.add('hidden-row'));
          const name = table.dataset.table;
          const btn = document.querySelector('button.show-more[data-target-table="' + name + '"]');
          if(btn){
            btn.hidden = false;
            btn?.addEventListener('click', () => {
              rows.slice(limit).forEach(r => r.classList.toggle('hidden-row'));
              const expanded = rows.slice(limit)[0].classList.contains('hidden-row') === false;
              btn.textContent = expanded ? 'Show less' : 'Show more';
            });
          }
        });
      }
      
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => { makeSortable(); }, 0); 
      } else {
        document.addEventListener('DOMContentLoaded', () => { makeSortable(); });
      }
      
      document.addEventListener('DOMContentLoaded', () => { 
        initPagination(); 
      });
    })();`;
}
