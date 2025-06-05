document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.navbar a');

  // Tambahkan click listener untuk setiap nav link
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      // Hapus kelas .active dari semua link
      navLinks.forEach(l => l.classList.remove('active'));
      // Tambahkan .active pada link yang diklik
      this.classList.add('active');
    });
  });

  const observerOptions = {
    root: null,           // gunakan viewport
    threshold: 0.3,       // section dianggap aktif jika setidaknya 30% terlihat
    rootMargin: "-100px 0px 0px 0px" // atur offset atas (sesuaikan jika ada fixed header)
  };

  // Buat observer untuk mendeteksi bagian yang sedang aktif
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Hapus kelas .active dari semua link
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Dapatkan id section yang sedang aktif
        const id = entry.target.getAttribute('id');
        // Cari link navigasi yang sesuai dan tambahkan kelas .active
        const activeLink = document.querySelector(`.navbar a[href="#${id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  }, observerOptions);

  // Observasi setiap section
  sections.forEach(section => observer.observe(section));


    // Observasi setiap section
    sections.forEach(section => observer.observe(section));

    // This script disables the right-click (context menu)
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });
  });
