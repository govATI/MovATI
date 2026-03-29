// js/vitrine.js

let todosPerfis =[]; // Guarda em memória para filtrar rápido

document.addEventListener('DOMContentLoaded', () => {
    emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
    
    carregarPerfis();

    // Eventos Contato
    document.getElementById('btnFecharModal').addEventListener('click', fecharModal);
    document.getElementById('btnEnviarMsg').addEventListener('click', enviarMensagem);
    
    // Eventos Denúncia
    document.getElementById('btnFecharModalDenuncia').addEventListener('click', fecharModalDenuncia);
    document.getElementById('btnEnviarDenuncia').addEventListener('click', enviarDenuncia);
    
    // Filtro
    document.getElementById('btnBuscar').addEventListener('click', renderizarGrid);
});

async function carregarPerfis() {
    const grid = document.getElementById('grid-perfis');
    
    const { data: perfis, error } = await supabaseClient
        .from('perfis_ati')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error || !perfis || perfis.length === 0) {
        grid.innerHTML = '<p class="text-ink-600 dark:text-ink-400 col-span-full text-center py-10">Nenhum talento encontrado no momento.</p>';
        return;
    }

    todosPerfis = perfis;
    renderizarGrid();
}

function renderizarGrid() {
    const areaFiltro = document.getElementById('filtroArea').value;
    const habFiltro = document.getElementById('filtroHab').value.toLowerCase().trim();
    const grid = document.getElementById('grid-perfis');
    
    grid.innerHTML = '';

    const perfisFiltrados = todosPerfis.filter(p => {
        const bateArea = areaFiltro === '' || p.area === areaFiltro;
        const bateHab = habFiltro === '' || (p.habilidades && p.habilidades.some(tag => tag.toLowerCase().includes(habFiltro)));
        return bateArea && bateHab;
    });

    if (perfisFiltrados.length === 0) {
        grid.innerHTML = '<p class="text-ink-600 dark:text-ink-400 col-span-full text-center py-10">Nenhum perfil corresponde aos seus filtros.</p>';
        return;
    }

    perfisFiltrados.forEach(perfil => {
        let tagsHtml = (perfil.habilidades ||[]).map(tag => 
            `<span class="bg-ink-100 dark:bg-ink-700 text-ink-600 dark:text-ink-300 text-xs px-2.5 py-1 rounded-md font-medium">${tag}</span>`
        ).join('');

        const card = `
            <div class="bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-extrabold text-xl text-brand-900 dark:text-white">${perfil.nome_publico}</h3>
                    ${perfil.tem_funcao === 'Sim' ? '<span class="bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-brand-200 dark:border-brand-700">C/ Função</span>' : ''}
                </div>
                
                <p class="text-xs text-brand-600 dark:text-brand-400 font-bold mb-4 uppercase tracking-wider">${perfil.area || 'TI Geral'}</p>

                <div class="text-sm mb-5 text-ink-600 dark:text-ink-300 space-y-1">
                    <p><strong>Lotação:</strong> ${perfil.orgao_atual}</p>
                    <p><strong>Quer ir para:</strong> ${perfil.orgao_destino || 'Aberto a propostas'}</p>
                </div>
                
                <div class="flex flex-wrap gap-2 mb-6">${tagsHtml}</div>
                
                <button onclick="abrirModal('${perfil.nome_publico}', '${perfil.email_contato}')" 
                        class="w-full bg-brand-50 dark:bg-ink-700 text-brand-700 dark:text-white border border-brand-300 dark:border-ink-600 font-bold py-2.5 rounded-lg hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 transition">
                    Demonstrar Interesse
                </button>
                
                <button onclick="abrirModalDenuncia('${perfil.nome_publico}', '${perfil.email_contato}')" 
                        class="text-xs text-red-500/70 hover:text-red-600 dark:hover:text-red-400 mt-4 text-center block w-full transition font-medium">
                    Reportar problema neste perfil
                </button>
            </div>
        `;
        grid.innerHTML += card;
    });
}

// ---- Modais Contato ----
window.abrirModal = function(nome, email) {
    document.getElementById('modalNomeDestino').innerText = nome;
    document.getElementById('modalEmailDestino').value = email;
    document.getElementById('modalContato').classList.remove('hidden');
};

function fecharModal() {
    document.getElementById('modalContato').classList.add('hidden');
    document.getElementById('remetenteNome').value = '';
    document.getElementById('remetenteEmail').value = '';
    document.getElementById('remetenteMsg').value = '';
}

// ---- Modais Denúncia ----
// É ESSA FUNÇÃO AQUI QUE O NAVEGADOR NÃO ESTAVA ACHANDO!
window.abrirModalDenuncia = function(nome, email) {
    document.getElementById('modalNomeDenuncia').innerText = nome;
    document.getElementById('modalEmailDenuncia').value = email;
    document.getElementById('modalDenuncia').classList.remove('hidden');
};

function fecharModalDenuncia() {
    document.getElementById('modalDenuncia').classList.add('hidden');
    document.getElementById('denuncianteEmail').value = '';
    document.getElementById('denuncianteMsg').value = '';
}

// ---- Funções de Envio de E-mail (Usando o Template 2 Coringa) ----
function enviarMensagem() {
    const btn = document.getElementById('btnEnviarMsg');

    const nomeRemetente = document.getElementById('remetenteNome').value.trim();
    const emailRemetente = document.getElementById('remetenteEmail').value.trim();
    const msg = document.getElementById('remetenteMsg').value.trim();
    const nomeDestino = document.getElementById('modalNomeDestino').innerText;

    if (!nomeRemetente || !emailRemetente || !msg) {
        alert("Preencha todos os campos antes de enviar.");
        return;
    }

    btn.innerText = "Enviando...";
    btn.disabled = true;

    const textoFormatado = `Olá ${nomeDestino}!\n\nO(a) colega ${nomeRemetente} (${emailRemetente}) viu seu perfil na vitrine do MovATI e deixou a seguinte mensagem para você:\n\n"${msg}"\n\nPara responder, basta clicar em "Responder" neste e-mail.`;

    const templateParams = {
        to_email: document.getElementById('modalEmailDestino').value,
        from_name: `${nomeRemetente} via MovATI`,
        reply_to: emailRemetente,
        subject: `Novo interesse no seu perfil MovATI - de ${nomeRemetente}`,
        message: textoFormatado
    };

    emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_MENSAGEM, templateParams)
        .then(() => {
            alert("Mensagem enviada com sucesso ao servidor!");
            fecharModal();
        })
        .catch((error) => {
            alert("Erro ao enviar mensagem.");
            console.error(error);
        })
        .finally(() => {
            btn.innerText = "Enviar E-mail";
            btn.disabled = false;
        });
}

function enviarDenuncia() {
    const btn = document.getElementById('btnEnviarDenuncia');
    
    const emailRemetente = document.getElementById('denuncianteEmail').value.trim() || 'anonimo@movati.gov.br';
    const msg = document.getElementById('denuncianteMsg').value.trim();
    const nomeAlvo = document.getElementById('modalNomeDenuncia').innerText;
    const emailAlvo = document.getElementById('modalEmailDenuncia').value;

    if (!msg) {
        alert("Por favor, descreva o problema antes de enviar.");
        return;
    }

    btn.innerText = "Enviando...";
    btn.disabled = true;

    const textoFormatado = `ALERTA SOBRE O PERFIL: ${nomeAlvo} (${emailAlvo})\n\nEnviado por: ${emailRemetente}\n\nMotivo da denúncia reportado pelo usuário:\n${msg}`;

    const templateParams = {
        to_email: CONFIG.ADMIN_EMAIL,
        from_name: 'Alerta do Sistema MovATI',
        reply_to: emailRemetente,
        subject: '⚠️ ALERTA MOVATI: Denúncia de Perfil',
        message: textoFormatado
    };

    emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_MENSAGEM, templateParams)
        .then(() => {
            alert("Alerta enviado com sucesso à administração. Obrigado!");
            fecharModalDenuncia();
        })
        .catch((error) => {
            alert("Erro ao enviar o alerta.");
            console.error(error);
        })
        .finally(() => {
            btn.innerText = "Enviar Alerta";
            btn.disabled = false;
        });
}