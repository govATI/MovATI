// js/cadastro.js

let dadosServidor = {};
let codigoGerado = '';

const dominiosExtras =['gmail.com', 'ipea.gov.br', 'ibge.gov.br', 'ebserh.gov.br', 'bcb.gov.br'];

document.addEventListener('DOMContentLoaded', () => {
    emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);

    document.getElementById('btnValidar').addEventListener('click', validarNoCSV);
    document.getElementById('btnEnviarCodigo').addEventListener('click', enviarCodigoVerificacao);
    document.getElementById('btnVerificarCodigo').addEventListener('click', verificarCodigo);
    document.getElementById('btnSalvar').addEventListener('click', salvarNoSupabase);
    document.getElementById('btnRemover').addEventListener('click', removerPerfil);

    configurarInputsCodigo();
});

function isEmailGovernamental(email) {
    email = email.toLowerCase().trim();
    if (!email.includes('@')) return false;
    const dominio = email.split('@')[1];
    if (dominio.endsWith('gov.br')) return true;
    return dominiosExtras.includes(dominio);
}

// Controla a troca de passos visualmente
function irParaStep(n) {
    const steps =[null, 'step1', 'step2', 'step3', 'step4', 'step5'];
    const stepEls =[null, 'stepEl1', 'stepEl2', 'stepEl3', 'stepEl4'];

    document.querySelectorAll('[id^="step"]').forEach(el => {
        if (steps.includes(el.id)) el.classList.add('hidden');
    });
    document.getElementById(steps[n]).classList.remove('hidden');

    stepEls.forEach((id, i) => {
        if (!id) return;
        const el = document.getElementById(id);
        el.classList.remove('active', 'done');
        if (i < n) el.classList.add('done');
        else if (i === n) el.classList.add('active');
    });
}

// 1. Validar no CSV
function validarNoCSV() {
    const nomeDigitado = document.getElementById('nomeCompleto').value.trim().toUpperCase();
    const erroNome = document.getElementById('erroNome');
    erroNome.classList.remove('show');

    if (!nomeDigitado) {
        erroNome.classList.add('show');
        return;
    }

    const btn = document.getElementById('btnValidar');
    btn.innerText = "Buscando...";
    btn.disabled = true;

    Papa.parse("data/dados_atis.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const encontrado = results.data.find(ati => ati['Nome'] && ati['Nome'].toUpperCase() === nomeDigitado);

            if (encontrado) {
                dadosServidor.nome = encontrado['Nome'];
                dadosServidor.orgao_atual = encontrado['Órgão de Exercício'];
                dadosServidor.tem_funcao = encontrado['Tem Função?'];
                
                document.getElementById('lblNome').innerText = dadosServidor.nome;
                document.getElementById('lblOrgao').innerText = dadosServidor.orgao_atual;
                
                irParaStep(2);
            } else {
                erroNome.classList.add('show');
            }
            btn.innerText = "Verificar no Governo →";
            btn.disabled = false;
        },
        error: function() {
            erroNome.textContent = "Erro ao acessar a base de dados. Tente novamente.";
            erroNome.classList.add('show');
            btn.innerText = "Verificar no Governo →";
            btn.disabled = false;
        }
    });
}

// 2. Enviar Código para Email
function enviarCodigoVerificacao() {
    const email = document.getElementById('emailGov').value;
    const erroEmail = document.getElementById('erroEmail');
    erroEmail.classList.remove('show');
    
    if (!isEmailGovernamental(email)) {
        erroEmail.classList.add('show');
        return;
    }
    
    dadosServidor.email = email;
    codigoGerado = Math.floor(100000 + Math.random() * 900000).toString();

    const btn = document.getElementById('btnEnviarCodigo');
    btn.innerText = "Enviando...";
    btn.disabled = true;

    if (CONFIG.DEMO_MODE) {
        alert(`[MODO DEMO] O código de verificação é: ${codigoGerado}`);
        document.getElementById('emailMostrado').innerText = email;
        irParaStep(3);
        btn.innerText = "Receber Código →";
        btn.disabled = false;
        return;
    }

    emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_VERIFICACAO, {
        to_email: email,
        codigo: codigoGerado,
        to_name: dadosServidor.nome
    }).then(() => {
        document.getElementById('emailMostrado').innerText = email;
        irParaStep(3);
    }).catch(err => {
        alert("Erro ao enviar o e-mail de verificação. Tente novamente.");
        console.error(err);
    }).finally(() => {
        btn.innerText = "Receber Código →";
        btn.disabled = false;
    });
}

// Controle de input dos 6 quadrados do código
function configurarInputsCodigo() {
    const inputs = document.querySelectorAll('.code-digit');
    inputs.forEach((inp, i) => {
        inp.addEventListener('input', () => {
            inp.value = inp.value.replace(/\D/, '');
            if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
        });
        inp.addEventListener('keydown', e => {
            if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i - 1].focus();
        });
    });
}

// 3. Verificar o código digitado
async function verificarCodigo() {
    const digitado = Array.from(document.querySelectorAll('.code-digit')).map(d => d.value).join('');
    const erroCodigo = document.getElementById('erroCodigo');
    const btn = document.getElementById('btnVerificarCodigo');
    erroCodigo.classList.remove('show');
    
    if (digitado === codigoGerado) {
        btn.innerText = "Verificando perfil...";
        btn.disabled = true;

        // Verificar se este email já foi cadastrado antes no Supabase
        const { data, error } = await supabaseClient
            .from('perfis_ati')
            .select('*')
            .eq('email_contato', dadosServidor.email)
            .maybeSingle();

        if (data) {
            // Se já tem cadastro, preencher tudo e liberar botão de remoção
            document.getElementById('areaAtuacao').value = data.area || '';
            document.getElementById('orgaoPara').value = data.orgao_destino || '';
            document.getElementById('habilidades').value = (data.habilidades ||[]).join(', ');
            
            document.getElementById('btnRemover').classList.remove('hidden');
            document.getElementById('btnSalvar').innerText = "Atualizar Meu Perfil";
        }

        btn.innerText = "Confirmar E-mail";
        btn.disabled = false;
        irParaStep(4);
    } else {
        erroCodigo.classList.add('show');
    }
}

// Gerar nome "João M. S." ignorando preposições (de, da, do)
function gerarNomePublico(nomeCompleto) {
    const preposicoes = ['DE', 'DA', 'DO', 'DAS', 'DOS', 'E'];
    const partes = nomeCompleto.split(' ').filter(p => p.trim() !== '' && !preposicoes.includes(p.toUpperCase()));
    
    if (partes.length === 1) {
        return partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
    }
    
    const primeiroNome = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
    const iniciais = partes.slice(1).map(p => p.charAt(0).toUpperCase() + '.').join(' ');
    
    return `${primeiroNome} ${iniciais}`;
}

// 4. Salvar (ou Atualizar) no Banco
async function salvarNoSupabase() {
    const orgaoPara = document.getElementById('orgaoPara').value.trim();
    const area = document.getElementById('areaAtuacao').value;
    const inputHabilidades = document.getElementById('habilidades').value;
    const btn = document.getElementById('btnSalvar');
    
    if (!area) {
        alert("A seleção da Área de Atuação é obrigatória.");
        return;
    }

    let tags = inputHabilidades.split(',').map(t => t.trim()).filter(t => t !== '').slice(0, 10);
    const nomePublico = gerarNomePublico(dadosServidor.nome);

    const textoOriginal = btn.innerText;
    btn.innerText = "Salvando...";
    btn.disabled = true;

    // A função "upsert" irá ATUALIZAR caso o email_contato já exista, evitando duplicação.
    const { error } = await supabaseClient.from('perfis_ati').upsert([{
        nome_publico: nomePublico,
        orgao_atual: dadosServidor.orgao_atual,
        tem_funcao: dadosServidor.tem_funcao,
        area: area,
        orgao_destino: orgaoPara,
        habilidades: tags,
        email_contato: dadosServidor.email
    }], { onConflict: 'email_contato' });

    if (error) {
        alert("Erro ao salvar perfil: " + error.message);
        btn.innerText = textoOriginal;
        btn.disabled = false;
    } else {
        irParaStep(5);
    }
}

// 5. Remover Perfil
async function removerPerfil() {
    const confirmacao = confirm("Tem certeza que deseja remover seu perfil da vitrine? Esta ação não pode ser desfeita.");
    if (!confirmacao) return;

    const btn = document.getElementById('btnRemover');
    btn.innerText = "Removendo...";
    btn.disabled = true;

    const { error } = await supabaseClient
        .from('perfis_ati')
        .delete()
        .eq('email_contato', dadosServidor.email);

    if (error) {
        alert("Erro ao remover perfil: " + error.message);
        btn.innerText = "Remover Meu Perfil da Vitrine";
        btn.disabled = false;
    } else {
        alert("Seu perfil foi removido com sucesso da Vitrine!");
        window.location.href = "index.html";
    }
}