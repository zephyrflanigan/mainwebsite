const openBtn = document.getElementById('nav-open');
const closeBtn = document.getElementById('nav-close');
const overlay = document.getElementById('nav-overlay');
const drawer = document.getElementById('nav-drawer');

function openDrawer() {
    document.body.classList.add('drawer-open');
    document.body.style.overflow = 'hidden';
    openBtn.setAttribute('aria-expanded', 'true');
    drawer.focus();
}

function closeDrawer() {
    document.body.classList.remove('drawer-open');
    document.body.style.overflow = '';
    openBtn.setAttribute('aria-expanded', 'false');
    openBtn.focus();
}

openBtn.addEventListener('click', openDrawer);
closeBtn.addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);
document.querySelectorAll('.drawer-link').forEach(link => link.addEventListener('click', closeDrawer));

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) {
        closeDrawer();
    }
});

const nav = document.querySelector('nav');
function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 20);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// 3f/9a — active nav state (navbar + drawer)
const currentPath = window.location.pathname.replace(/\/$/, '') || '';
document.querySelectorAll('nav a[href], #nav-drawer a[href]').forEach((link) => {
    const linkPath = link.getAttribute('href').replace(/\/$/, '') || '';
    if (linkPath === currentPath) {
        link.classList.add('text-mauve', 'font-semibold');
        link.setAttribute('aria-current', 'page');
    }
});

// 3a — scroll-triggered reveal animations
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
