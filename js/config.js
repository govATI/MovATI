// js/config.js

const CONFIG = {
    // Modo de Desenvolvimento (true = exibe código na tela, false = envia e-mail de verdade)
    DEMO_MODE: false, 

    // Chaves do Supabase
    SUPABASE_URL: 'https://erzpaukuzqusinyiwgcc.supabase.co',
    SUPABASE_KEY: 'sb_publishable_OXvUcZhFmivqcDnFiy4Huw_3h0nzGeZ',
    
    // Chaves do EmailJS
    EMAILJS_PUBLIC_KEY: 'zbLfNwPXQadqgIG6f',
    EMAILJS_SERVICE_ID: 'service_5lqygog',
    
    // 2 templates
    EMAILJS_TEMPLATE_VERIFICACAO: 'template_yedaebl', 
    EMAILJS_TEMPLATE_MENSAGEM: 'template_hf0q98l',
    
    // E-mail que receberá as denúncias:
    ADMIN_EMAIL: 'diego.martins@ufg.br' 
};


// Inicializa o cliente do Supabase globalmente
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);