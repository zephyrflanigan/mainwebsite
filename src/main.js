// Mobile nav drawer
const openBtn = document.getElementById('nav-open');

function openDrawer() {
    document.body.classList.add('drawer-open');
    document.body.style.overflow = 'hidden';
    openBtn.setAttribute('aria-expanded', 'true');
    document.getElementById('nav-drawer').focus();
}

function closeDrawer() {
    document.body.classList.remove('drawer-open');
    document.body.style.overflow = '';
    openBtn.setAttribute('aria-expanded', 'false');
    openBtn.focus();
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) {
        closeDrawer();
    }
});

// Navbar scroll fade
(function () {
    const nav = document.querySelector('nav');
    function onScroll() {
        nav.classList.toggle('scrolled', window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();
