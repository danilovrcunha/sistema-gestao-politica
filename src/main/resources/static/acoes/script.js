console.log('[Ações] Mapa V15 - Interatividade + Agrupamento Ajustado');

document.addEventListener('DOMContentLoaded', () => {

    // =================== SEGURANÇA ===================
    function verificarBotaoNovo() {
        if (window.podeEditar && !window.podeEditar("editarAcoes")) {
            const btnNovo = document.querySelector('a[href="/registrarAcoes"]');
            if (btnNovo) btnNovo.style.display = 'none';
            document.querySelectorAll('.primary-btn').forEach(btn => {
                if(btn.textContent.includes("Nova") || btn.textContent.includes("Registrar")) btn.style.display = 'none';
            });
        }
    }
    if (localStorage.getItem("userRole")) verificarBotaoNovo();
    document.addEventListener("permissoesCarregadas", verificarBotaoNovo);
    // ================================================

    if (!window.L) return;

    // CONFIGURAÇÃO DO MAPA
    // Limites do Brasil
    const brazilBounds = [[5.5, -76.0], [-34.0, -32.0]];

    const map = L.map('map', {
        minZoom: 5,
        maxBounds: brazilBounds,
        maxBoundsViscosity: 1.0
    }).setView([-10.9472, -37.0731], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OSM', noWrap: true
    }).addTo(map);

    let heatLayer = null;
    let infoLayer = L.layerGroup().addTo(map);

    let coordenadasUsadas = [];

    // FUNÇÃO DE DISPERSÃO (JITTER) AJUSTADA
    const offsetMeters = (lat, lng, dx, dy) => {
        const dLat = dy / 111111;
        const dLng = dx / (111111 * Math.cos(lat * Math.PI / 180));
        return { lat: lat + dLat, lng: lng + dLng };
    };

    function gerarPontosDispersos(lat, lng, count) {
        const pts = [];
        // Limita visualmente para não explodir o mapa
        const maxVisual = Math.min(count, 50);

        for(let i=0; i<maxVisual; i++) {
            const r = Math.random() ** 0.6 * (8 * Math.sqrt(count));

            const theta = Math.random() * Math.PI * 2;
            const p = offsetMeters(lat, lng, r * Math.cos(theta), r * Math.sin(theta));

            // Retorna objeto com lat, lng e intensidade
            pts.push({ lat: p.lat, lng: p.lng, intensity: 0.7 });
        }
        return pts;
    }

    montarMapa();

    async function montarMapa() {
        if (!L.heatLayer) return;

        try {
            // Filtro Super Admin
            let url = '/api/acoes';
            const role = localStorage.getItem("userRole");
            const filtroId = localStorage.getItem("superAdminGabineteFilter");
            if (role === "SUPER_ADMIN" && filtroId) url += `?gabineteId=${filtroId}`;

            const res = await fetch(url);
            if(!res.ok) return;
            const acoes = await res.json();

            const grupos = groupByCep(acoes);
            const pontosHeatMap = [];

            infoLayer.clearLayers();
            coordenadasUsadas = [];

            for (const g of grupos) {
                if (!g.cep) continue;
                const geo = await geocodeSmart(g.cep);

                if (geo) {
                    // Aplica anti-colisão (evita sobreposição exata de ruas muito próximas)
                    const centro = aplicarDeslocamentoSeNecessario(geo.lat, geo.lng);

                    // Gera os pontos espalhados ao redor do centro
                    const pontosDispersos = gerarPontosDispersos(centro.lat, centro.lng, g.count);

                    // Adiciona ao Array do Mapa de Calor
                    pontosDispersos.forEach(p => {
                        pontosHeatMap.push([p.lat, p.lng, p.intensity]);
                    });

                    // Adiciona Marcadores Invisíveis para clique

                    let msgPrecisao = '';
                    if (geo.precisao === 'bairro') msgPrecisao = '<br><small style="color:orange">(Centro do Bairro)</small>';
                    if (geo.precisao === 'nucleo') msgPrecisao = '<br><small style="color:green">(Via Localizada)</small>';

                    const popupContent = `
                        <div style="text-align:center; font-family:sans-serif; min-width: 150px;">
                            <b style="font-size:14px; color:#2c3e50;">${geo.rua || geo.bairro}</b>${msgPrecisao}<br>
                            <span style="color:#7f8c8d; font-size:12px;">CEP: ${g.cep}</span>
                            <hr style="margin:6px 0; border:0; border-top:1px solid #eee;">
                            <div style="background:#f1f2f6; padding:5px; border-radius:4px;">
                                <b style="color:#e67e22; font-size: 16px;">${g.count}</b> 
                                <span style="font-size:12px; color:#555;">Ações aqui</span>
                            </div>
                        </div>
                    `;

                    // Coloca um marcador invisível, mas clicável, no centro da dispersão
                    L.circleMarker([centro.lat, centro.lng], {
                        radius: 20 + (g.count * 2), // O tamanho da área clicável aumenta conforme a quantidade
                        color: 'transparent',
                        fillColor: '#000',
                        fillOpacity: 0.0,
                        opacity: 0
                    }).bindPopup(popupContent).addTo(infoLayer);
                }

                await new Promise(r => setTimeout(r, 300));
            }

            if (pontosHeatMap.length) {
                if (heatLayer) heatLayer.remove();

                heatLayer = L.heatLayer(pontosHeatMap, {
                    radius: 30,
                    blur: 40,
                    maxZoom: 20,
                    minOpacity: 0.9,

                    // Gradiente Térmico: Verde -> Amarelo -> Laranja -> Vermelho
                    gradient: {
                        0.3: '#2ecc71',
                        0.5: '#f1c40f',
                        0.7: '#e67e22',
                        1.0: '#e74c3c'
                    }
                }).addTo(map);

                infoLayer.bringToFront();
            }
        } catch (e) { console.error(e); }
    }

    // --- ANTI-COLISÃO ---
    function aplicarDeslocamentoSeNecessario(lat, lng) {
        let novaLat = lat;
        let novaLng = lng;
        let colidiu = true;
        let tentativas = 0;

        while (colidiu && tentativas < 10) {
            colidiu = coordenadasUsadas.some(coord => {
                const dist = Math.sqrt(Math.pow(coord.lat - novaLat, 2) + Math.pow(coord.lng - novaLng, 2));
                return dist < 0.0004; // ~40 metros
            });

            if (colidiu) {
                novaLat += (Math.random() - 0.5) * 0.0015;
                novaLng += (Math.random() - 0.5) * 0.0015;
                tentativas++;
            }
        }
        coordenadasUsadas.push({ lat: novaLat, lng: novaLng });
        return { lat: novaLat, lng: novaLng };
    }

    function groupByCep(lista) {
        const m = new Map();
        lista.forEach(a => {
            const cep = (a.cep || '').replace(/\D/g, '');
            if(cep.length === 8) {
                const i = m.get(cep) || { cep, count: 0 };
                i.count++;
                m.set(cep, i);
            }
        });
        return Array.from(m.values());
    }

    // =================== GEOCODIFICAÇÃO INTELIGENTE ===================
    function extrairNucleoNome(logradouro) {
        if (!logradouro) return "";
        let limpo = logradouro.split(' - ')[0].trim();
        const regexPrefixos = /^(Rua|R\.|Avenida|Av\.|Travessa|Tv\.|Alameda|Al\.|Praça|Pça\.|Rodovia|Estrada|Largo|Beco)\s+/i;
        const regexTitulos = /^(Doutor|Dr\.|Professor|Prof\.|Coronel|Cel\.|General|Gen\.|Marechal|Mal\.|Desembargador|Des\.|Ministro|Min\.|Padre|Pe\.|Dom|Governador|Gov\.|Presidente|Pres\.|Deputado|Dep\.|Engenheiro|Eng\.)\s+/i;

        limpo = limpo.replace(regexPrefixos, '').trim();
        limpo = limpo.replace(regexTitulos, '').trim();
        limpo = limpo.replace(regexPrefixos, '').trim();
        return limpo;
    }

    async function buscarNominatim(params) {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('limit', '1');
        url.searchParams.set('country', 'Brazil');
        if(params.street) url.searchParams.set('street', params.street);
        if(params.city) url.searchParams.set('city', params.city);
        if(params.state) url.searchParams.set('state', params.state);

        const res = await fetch(url);
        const data = await res.json();
        return data.length > 0 ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
    }

    async function geocodeSmart(cep) {
        const CACHE_KEY = 'geoV15_' + cep; // Cache novo
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);

        try {
            const viaRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const viaData = await viaRes.json();
            if (viaData.erro) return null;

            const ruaOriginal = viaData.logradouro.split(' - ')[0].trim();
            const nomeNucleo = extrairNucleoNome(ruaOriginal);
            let coords = null;
            let precisao = 'exata';

            coords = await buscarNominatim({ street: ruaOriginal, city: viaData.localidade, state: viaData.uf });

            if (!coords && nomeNucleo.length > 3) {
                coords = await buscarNominatim({ street: nomeNucleo, city: viaData.localidade, state: viaData.uf });
                if (coords) precisao = 'nucleo';
            }

            if (!coords && viaData.bairro) {
                const query = `Bairro ${viaData.bairro}, ${viaData.localidade}, ${viaData.uf}`;
                const resBairro = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`);
                const dataBairro = await resBairro.json();
                if(dataBairro.length > 0) {
                    coords = { lat: parseFloat(dataBairro[0].lat), lng: parseFloat(dataBairro[0].lon) };
                    precisao = 'bairro';
                }
            }

            if (coords) {
                const result = {
                    lat: coords.lat, lng: coords.lng,
                    rua: ruaOriginal, bairro: viaData.bairro, precisao: precisao
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(result));
                return result;
            }
        } catch (e) { console.error("Erro geocode:", e); }
        return null;
    }
});