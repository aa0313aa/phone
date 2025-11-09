document.addEventListener('DOMContentLoaded', () => {
  // Back to top
  const back = document.getElementById('backToTop');
  back?.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // KakaoTalk Channel integration (optional)
  try {
    const appKey = document.querySelector('meta[name="kakao-app-key"]')?.content?.trim();
    const channelId = document.querySelector('meta[name="kakao-channel-id"]')?.content?.trim();

    if (appKey && window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(appKey);
    }

    if (channelId && window.Kakao?.Channel) {
      const addBtnTop = document.querySelector('#kakao-add-channel-button-top');
      if (addBtnTop) {
        window.Kakao.Channel.createAddChannelButton({
          container: '#kakao-add-channel-button-top',
          channelPublicId: channelId,
        });
      }

      const addBtn = document.querySelector('#kakao-add-channel-button');
      if (addBtn) {
        window.Kakao.Channel.createAddChannelButton({
          container: '#kakao-add-channel-button',
          channelPublicId: channelId,
        });
      }

      const chatBtn = document.querySelector('#kakao-talk-channel-chat-button');
      if (chatBtn) {
        window.Kakao.Channel.createChatButton({
          container: '#kakao-talk-channel-chat-button',
          channelPublicId: channelId,
        });
      }
    }
  } catch (e) {
    console.warn('Kakao SDK init skipped:', e);
  }

  // Copy-to-clipboard for Kakao ID
  document.querySelectorAll('[data-copy-text]')?.forEach((el) => {
    el.addEventListener('click', async () => {
      const text = el.getAttribute('data-copy-text');
      if (!text) return;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.position = 'absolute';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        const original = el.innerHTML;
        el.innerHTML = '<i class="bi bi-clipboard-check me-2"></i>복사됨';
        setTimeout(() => { el.innerHTML = original; }, 1500);
      } catch (err) {
        console.warn('Copy failed', err);
      }
    });
  });

  // Render 추천 기기 (products)
  const productsData = [
  { id: 'p1', model: '아이폰 17 PRO', subtitle: '온라인/오프라인 재고보유, 신규가능/미납 연체가능', img: 'assets/img/iphone17pro.png' },
  { id: 'p2', model: '아이폰 17 PRO MAX', subtitle: '온라인/오프라인 재고보유, 신규가능/미납 연체가능', img: 'assets/img/iphone17pro.png' },
  { id: 'p3', model: '아이폰 16 PRO MAX', subtitle: '온라인/오프라인 재고보유, 신규가능/미납 연체가능', img: 'assets/img/iphone16promax.png' },
    { id: 'p4', model: '갤럭시 Z폴드7', subtitle: '온라인/오프라인 재고보유, 신규가능/미납 연체가능', img: 'assets/img/zFold7.png' },
  ];

  const listEl = document.getElementById('productsList');
  if (listEl) {
    const frag = document.createDocumentFragment();
    productsData.forEach((p) => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-3';
      col.innerHTML = `
        <div class="card h-100">
          <img src="${p.img}" alt="${p.model}" class="card-img-top" loading="lazy">
          <div class="card-body d-flex flex-column">
            <h4 class="h6 mb-1">${p.model}
              <span class="badge" style="background: var(--brand); color:#fff; margin-left:6px;">최고가 매입</span>
            </h4>
            <div class="text-secondary small">${p.subtitle}</div>
            <div class="mt-3 d-flex justify-content-between align-items-center">
              <div></div>
              <div class="d-flex flex-column gap-2 align-items-end">
                <a class="btn btn-sm btn-outline-primary" href="contact.html">문의</a>
                <a class="btn btn-sm btn-primary" href="contact.html">즉시 매입 신청</a>
              </div>
            </div>
          </div>
        </div>`;
      frag.appendChild(col);
    });
    listEl.innerHTML = '';
    listEl.appendChild(frag);
  }
});
