const BETA_CONFIG = {
  iosTestflightUrl: 'https://testflight.apple.com/join/YeCD16Zv',
  androidPlayOptInUrl: '',
};

function detectPlatform() {
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/CrOS/i.test(ua)) return 'web';
  if (/Mac|Win|Linux/i.test(ua)) return 'desktop';
  return 'web';
}

function setActiveTab(target) {
  document.querySelectorAll('.tab').forEach((tab) => {
    const active = tab.getAttribute('data-target') === target;
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === 'panel-' + target);
  });
}

function wireLink(id, url, pendingLabel) {
  const el = document.getElementById(id);
  if (!el) return;
  if (url) {
    el.href = url;
    el.classList.remove('disabled');
  } else {
    el.removeAttribute('href');
    el.classList.add('disabled');
    el.textContent = pendingLabel;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  wireLink('iosTestflightBtn', BETA_CONFIG.iosTestflightUrl, 'TestFlight link coming soon');
  wireLink('androidOptInBtn', BETA_CONFIG.androidPlayOptInUrl, 'Play Store opt-in coming soon');

  const form = document.getElementById('androidJoinForm');
  const emailInput = document.getElementById('androidEmail');
  const hpInput = document.getElementById('androidWebsite');
  const submitBtn = document.getElementById('androidSubmitBtn');
  const statusEl = document.getElementById('androidStatus');
  const optInBtn = document.getElementById('androidOptInBtn');

  if (form && emailInput && submitBtn && statusEl) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Adding...';
      statusEl.className = 'join-status';
      statusEl.textContent = '';

      try {
        const res = await fetch('/api/join-android-beta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            website: hpInput ? hpInput.value : '',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          statusEl.className = 'join-status ok';
          statusEl.textContent = data.alreadyMember
            ? 'You are already in the beta group. Tap Step 2 below to install from Google Play.'
            : 'Added! Tap Step 2 below to become a tester and install from Google Play.';
          emailInput.value = '';
          const optUrl = data.optInUrl || BETA_CONFIG.androidPlayOptInUrl;
          if (optInBtn && optUrl) {
            optInBtn.href = optUrl;
            optInBtn.textContent = 'Opt in on Google Play';
            optInBtn.classList.remove('disabled', 'ghost');
          }
        } else {
          statusEl.className = 'join-status err';
          statusEl.textContent = data.error || 'Could not add that email. Please try again.';
        }
      } catch {
        statusEl.className = 'join-status err';
        statusEl.textContent = 'Network error. Please check your connection and try again.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Join Android Beta';
      }
    });
  }

  const hash = (window.location.hash || '').replace('#', '').toLowerCase();
  const initial = ['ios', 'android', 'desktop', 'web'].includes(hash) ? hash : detectPlatform();
  setActiveTab(initial);

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target');
      if (target) setActiveTab(target);
    });
  });
});
