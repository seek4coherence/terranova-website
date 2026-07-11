/* ===================================
   Terra Nova Equity LLC - JavaScript
   =================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Navbar Scroll Effect ---
  const navbar = document.getElementById('navbar');

  const handleNavScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // --- Mobile Navigation ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close mobile nav when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // --- Smooth Scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      e.preventDefault();
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // --- Form Tab Switching ---
  const tabs = document.querySelectorAll('.form-tab');
  const panels = document.querySelectorAll('.form-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active panel
      panels.forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${target}`).classList.add('active');
    });
  });

  // --- Form Submission via Fetch (AJAX) ---
  const forms = document.querySelectorAll('.form-container form');

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      try {
        const formData = new FormData(form);
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          // Track lead submission in Google Analytics
          const submissionType = formData.get('submission_type') || 'Unknown';
          if (typeof gtag === 'function') {
            gtag('event', 'generate_lead', {
              event_category: 'Form Submission',
              event_label: submissionType + ' Inquiry',
              form_type: submissionType,
              value: 1
            });
          }

          // Show success message
          form.style.display = 'none';
          const successEl = form.parentElement.querySelector('.form-success');
          if (successEl) {
            successEl.classList.add('show');
          }

          // Reset after 5 seconds
          setTimeout(() => {
            form.reset();
            form.style.display = '';
            if (successEl) {
              successEl.classList.remove('show');
            }
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }, 5000);
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        submitBtn.textContent = 'Error, Try Again';
        submitBtn.disabled = false;
        setTimeout(() => {
          submitBtn.textContent = originalText;
        }, 3000);
      }
    });
  });

  // --- Scroll Reveal Animations ---
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // --- Stagger animation for grid children ---
  const staggerContainers = document.querySelectorAll('.benefits-grid, .steps-grid, .services-grid, .about-values');

  staggerContainers.forEach(container => {
    const children = container.querySelectorAll('.reveal, .benefit-card, .step-card, .service-card, .value-item');
    children.forEach((child, index) => {
      child.style.transitionDelay = `${index * 0.1}s`;
    });
  });

});
