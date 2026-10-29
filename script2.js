// Carrega dados salvos ou inicia arrays vazios
let transacoes = JSON.parse(localStorage.getItem('transacoes_cafe')) || [];
let sacasLotes = JSON.parse(localStorage.getItem('sacas_cafe')) || [];

// Elementos Financeiros
const form = document.getElementById('formTransacao');
const tabela = document.getElementById('tabelaTransacoes');
const totalReceitaEl = document.getElementById('totalReceita');
const totalDespesaEl = document.getElementById('totalDespesa');
const totalSaldoEl = document.getElementById('totalSaldo');

// Elementos de Sacas
const formSacas = document.getElementById('formSacas');
const tabelaSacas = document.getElementById('tabelaSacas');

// Preenche a data de hoje por padrão no input financeiro
const inputData = document.getElementById('data');
if (inputData) {
    inputData.valueAsDate = new Date();
}

// --- LÓGICA FINANCEIRA ---
if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const novaTransacao = {
            id: generateID(),
            descricao: document.getElementById('descricao').value,
            tipo: document.getElementById('tipo').value,
            categoria: document.getElementById('categoria').value,
            valor: parseFloat(document.getElementById('valor').value),
            data: document.getElementById('data').value
        };

        transacoes.push(novaTransacao);
        atualizarSistema();
        form.reset();
        if (inputData) inputData.valueAsDate = new Date();
    });
}

// --- LÓGICA DE SACAS ---
if (formSacas) {
    formSacas.addEventListener('submit', function(e) {
        e.preventDefault();

        const safraInput = document.getElementById('safraLote').value;
        const qtdInput = parseInt(document.getElementById('qtdSacas').value);
        const precoInput = parseFloat(document.getElementById('precoSaca').value);

        const novoLote = {
            id: generateID(),
            safraLote: safraInput,
            qtdSacas: qtdInput,
            precoSaca: precoInput
        };

        sacasLotes.push(novoLote);
        atualizarSistema();
        formSacas.reset();
    });
}

function generateID() {
    return Math.floor(Math.random() * 1000000000);
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataIso) {
    if (!dataIso) return '';
    const partes = dataIso.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function removerTransacao(id) {
    transacoes = transacoes.filter(t => t.id !== id);
    atualizarSistema();
}

function removerSaca(id) {
    sacasLotes = sacasLotes.filter(s => s.id !== id);
    atualizarSistema();
}

function atualizarSistema() {
    // 1. Atualizar Tabela e Resumo Financeiro
    if (tabela) {
        tabela.innerHTML = '';
        let totalReceitas = 0;
        let totalDespesas = 0;

        transacoes.forEach(t => {
            const tr = document.createElement('tr');
            
            const valorFormatado = formatarMoeda(t.valor);
            const classeValor = t.tipo === 'receita' ? 'text-receita' : 'text-despesa';
            const sinal = t.tipo === 'receita' ? '+ ' : '- ';

            tr.innerHTML = `
                <td>${formatarData(t.data)}</td>
                <td>${t.descricao}</td>
                <td>${t.categoria}</td>
                <td class="${classeValor}">${sinal}${valorFormatado}</td>
                <td><button class="btn-excluir" onclick="removerTransacao(${t.id})">Excluir</button></td>
            `;

            tabela.appendChild(tr);

            if (t.tipo === 'receita') {
                totalReceitas += t.valor;
            } else {
                totalDespesas += t.valor;
            }
        });

        const saldo = totalReceitas - totalDespesas;

        if (totalReceitaEl) totalReceitaEl.textContent = formatarMoeda(totalReceitas);
        if (totalDespesaEl) totalDespesaEl.textContent = formatarMoeda(totalDespesas);
        if (totalSaldoEl) {
            totalSaldoEl.textContent = formatarMoeda(saldo);
            totalSaldoEl.style.color = saldo >= 0 ? 'var(--accent)' : 'var(--danger)';
        }
    }

    // 2. Atualizar Tabela de Sacas
    if (tabelaSacas) {
        tabelaSacas.innerHTML = '';
        sacasLotes.forEach(s => {
            const tr = document.createElement('tr');
            const totalEstimado = s.qtdSacas * s.precoSaca;

            tr.innerHTML = `
                <td>${s.safraLote}</td>
                <td>${s.qtdSacas} sc</td>
                <td>${formatarMoeda(s.precoSaca)}</td>
                <td><strong>${formatarMoeda(totalEstimado)}</strong></td>
                <td><button class="btn-excluir" onclick="removerSaca(${s.id})">Excluir</button></td>
            `;

            tabelaSacas.appendChild(tr);
        });
    }

    // 3. Atualizar Resumo Visual / Gráfico de Despesas por Categoria
    const containerGrafico = document.getElementById('graficoCategorias');
    if (containerGrafico) {
        containerGrafico.innerHTML = '';

        // Filtra apenas as despesas e soma por categoria
        const despesas = transacoes.filter(t => t.tipo === 'despesa');
        const totaisPorCategoria = {};
        let totalGeralDespesas = 0;

        despesas.forEach(t => {
            const cat = t.categoria || 'Outros';
            totaisPorCategoria[cat] = (totaisPorCategoria[cat] || 0) + Number(t.valor);
            totalGeralDespesas += Number(t.valor);
        });

        if (Object.keys(totaisPorCategoria).length === 0) {
            containerGrafico.innerHTML = '<p style="color: #666; font-size: 0.9rem;">Nenhuma despesa registrada para gerar o gráfico.</p>';
        } else {
            for (let categoria in totaisPorCategoria) {
                const valorCat = totaisPorCategoria[categoria];
                const porcentagem = totalGeralDespesas > 0 ? (valorCat / totalGeralDespesas) * 100 : 0;

                const divBarra = document.createElement('div');
                divBarra.className = 'barra-container';
                divBarra.innerHTML = `
                    <div class="barra-info">
                        <span>${categoria}</span>
                        <span>${formatarMoeda(valorCat)} (${porcentagem.toFixed(1)}%)</span>
                    </div>
                    <div class="barra-fundo">
                        <div class="barra-preenchimento" style="width: ${porcentagem}%"></div>
                    </div>
                `;
                containerGrafico.appendChild(divBarra);
            }
        }
    }

    // Salvar tudo no navegador
    localStorage.setItem('transacoes_cafe', JSON.stringify(transacoes));
    localStorage.setItem('sacas_cafe', JSON.stringify(sacasLotes));
}

// Executa na inicialização
atualizarSistema();