document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.navbar a');
  
  // Adjust these options to your layout.
  const observerOptions = {
    root: null,           // use the viewport
    threshold: 0.3,       // section is active when at least 30% is visible
    // Shift the viewport downward to compensate for your fixed header height, if needed.
    rootMargin: "-100px 0px 0px 0px"
  };

  // Create the observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remove active class from all nav links
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Get ID of the section in view
        const id = entry.target.getAttribute('id');
        
        // Add active class to the corresponding nav link
        const activeLink = document.querySelector(`.navbar a[href="#${id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));


    // Observasi setiap section
    sections.forEach(section => observer.observe(section));

    // This script disables the right-click (context menu)
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });
  });
