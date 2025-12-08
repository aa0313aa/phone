document.addEventListener('DOMContentLoaded', () => {

  // --- GSAP Animations ---
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Hero Text Stagger
    gsap.from('.gsap-hero-text', {
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out'
    });

    // Hero Image Float Entrance
    gsap.from('.gsap-hero-img', {
      x: 50,
      opacity: 0,
      duration: 1.2,
      delay: 0.5,
      ease: 'power3.out'
    });

    // Fade Up Elements on Scroll
    gsap.utils.toArray('.gsap-fade-up').forEach((elem) => {
      gsap.from(elem, {
        scrollTrigger: {
          trigger: elem,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
      });
    });
  }

  // --- Back to Top ---
  const back = document.getElementById('backToTop');
  if (back) {
    back.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Live Reservation Simulation ---
  const reservationTable = document.getElementById('homeReservationsBody');
  if (reservationTable) {
    const regions = ['서울 강남', '서울 홍대', '인천 부평', '경기 수원', '경기 분당', '부산 서면', '대구 동성로', '광주 충장로', '대전 둔산', '강원 춘천', '충남 천안'];
    const names = ['김○○', '이○○', '박○○', '최○○', '정○○', '강○○', '조○○', '윤○○', '장○○', '임○○', '한○○'];
    const statuses = ['접수완료', '상담중', '매입완료', '입금완료'];

    function generateRow(index) {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const phone = `010-****-${Math.floor(1000 + Math.random() * 9000)}`;

      const now = new Date();
      // Random time within fast few hours
      const time = new Date(now - Math.floor(Math.random() * 10000000));
      const timeStr = time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

      let badgeClass = 'secondary';
      let icon = 'clock';

      if (status === '입금완료') { badgeClass = 'success'; icon = 'check-circle-fill'; }
      else if (status === '매입완료') { badgeClass = 'primary'; icon = 'wallet-fill'; }
      else if (status === '상담중') { badgeClass = 'warning text-dark'; icon = 'headset'; }

      return `
        <tr>
          <td class="d-none d-md-table-cell text-center text-muted">${index}</td>
          <td class="fw-medium">${region}</td>
          <td class="d-none d-lg-table-cell text-muted small">${timeStr}</td>
          <td>${name}</td>
          <td class="d-none d-md-table-cell text-muted small">${phone}</td>
          <td><span class="badge bg-${badgeClass} rounded-pill"><i class="bi bi-${icon} me-1"></i>${status}</span></td>
        </tr>
      `;
    }

    // Initial Population
    let rows = '';
    for (let i = 1; i <= 7; i++) {
      rows += generateRow(i);
    }
    reservationTable.innerHTML = rows;

    // Simulate New Entry every few seconds
    setInterval(() => {
      const newRow = generateRow(1); // logical 1
      // For simplicity, just insert at top and remove last
      reservationTable.insertAdjacentHTML('afterbegin', newRow);
      if (reservationTable.children.length > 7) {
        reservationTable.lastElementChild.remove();
      }

      // Update indices
      Array.from(reservationTable.children).forEach((row, idx) => {
        const idxCell = row.querySelector('td:first-child');
        if (idxCell) idxCell.textContent = idx + 1;
      });

    }, 4000 + Math.random() * 3000); // 4-7 seconds random
  }

  // --- Products Render ---
  const productsData = [
    { model: '아이폰 17 PRO', subtitle: '무방문 비대면 폰테크', img: 'assets/img/iphone17pro.png' },
    { model: '아이폰 17 PRO MAX', subtitle: '당일 즉시 현금지급', img: 'assets/img/iphone17pro.png' },
    { model: '아이폰 16 PRO MAX', subtitle: '매장 방문 상담 환영', img: 'assets/img/iphone16promax.png' },
    { model: '갤럭시 Z폴드7', subtitle: '대납개통 가능', img: 'assets/img/zFold7.png' },
  ];

  const listEl = document.getElementById('productsList');
  if (listEl) {
    listEl.innerHTML = productsData.map(p => `
      <div class="col-12 col-md-6 col-lg-3 gsap-fade-up">
        <div class="card h-100 border-0 shadow-sm service-card" style="padding: 1rem;">
          <div class="text-center p-3">
             <img src="${p.img}" alt="${p.model}" class="img-fluid" style="max-height: 180px; object-fit: contain;">
          </div>
          <div class="card-body text-center">
            <span class="badge bg-danger bg-opacity-10 text-danger mb-2">HOT</span>
            <h4 class="h6 fw-bold mb-1">${p.model}</h4>
            <p class="small text-muted mb-3">${p.subtitle}</p>
            <a href="contact.html" class="btn btn-outline-primary btn-sm rounded-pill w-100">시세 확인</a>
          </div>
        </div>
      </div>
    `).join('');
  }
});
