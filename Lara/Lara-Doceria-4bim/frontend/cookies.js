// Gerenciamento de Cookies

document.addEventListener('DOMContentLoaded', () => {
  const cookieBanner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('acceptCookies');
  const rejectBtn = document.getElementById('rejectCookies');

  // Verificar se o usuário já respondeu sobre cookies
  const cookieConsent = localStorage.getItem('cookieConsent');

  if (cookieConsent) {
    // Se já decidiu, esconde o banner
    cookieBanner.classList.add('hidden');
  } else {
    // Mostra o banner se não decidiu ainda
    cookieBanner.classList.remove('hidden');
  }

  // Botão Aceitar
  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieAcceptedAt', new Date().toISOString());
    
    // Ativar Google Analytics ou outros scripts de rastreamento
    activateAnalytics();
    
    // Esconder banner
    cookieBanner.classList.add('hidden');
    
    console.log('✅ Cookies aceitos');
  });

  // Botão Rejeitar
  rejectBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'rejected');
    localStorage.setItem('cookieRejectedAt', new Date().toISOString());
    
    // Não ativar scripts de rastreamento
    
    // Esconder banner
    cookieBanner.classList.add('hidden');
    
    console.log('❌ Cookies rejeitados');
  });
});

// Função para ativar Analytics (quando aceitar)
function activateAnalytics() {
  // Você pode adicionar Google Analytics ou outro sistema aqui
  // Exemplo com Google Analytics:
  /*
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
  */
  
  // Aqui você pode carregar scripts de rastreamento
  console.log('Analytics ativado');
}

// Função para verificar se cookies foram aceitos
function cookiesAceitos() {
  return localStorage.getItem('cookieConsent') === 'accepted';
}

// Função para limpar consentimento (para testes)
function limparCookieConsent() {
  localStorage.removeItem('cookieConsent');
  localStorage.removeItem('cookieAcceptedAt');
  localStorage.removeItem('cookieRejectedAt');
  location.reload();
}
