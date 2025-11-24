console.log('[Ações] Mapa V12 - Núcleo do Nome + Filtro Super Admin');

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

    // MAPA BASE
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

    // DISPERSÃO
    const offsetMeters = (lat, lng, dx, dy) => {
        const dLat = dy / 111111;
        const dLng = dx / (111111 * Math.cos(lat * Math.PI / 180));
        return { lat: lat + dLat, lng: lng + dLng };
    };

    function jitterPoints(lat, lng, count) {
        if (count <= 1) return [[lat, lng, 1.0]];
        const pts = [];
        const max = Math.min(count, 50);
        for(let i=0; i<max; i++) {
            const r = Math.random() ** 0.6 * (15 * Math.sqrt(count));
            const theta = Math.random() * Math.PI * 2;
            const p = offsetMeters(lat, lng, r * Math.cos(theta), r * Math.sin(theta));
            pts.push([p.lat, p.lng, 0.7]);
        }
        return pts;
    }

    montarMapa();

    async function montarMapa() {
        if (!L.heatLayer) return;
        try {
            // --- ALTERAÇÃO DE FILTRO (SUPER ADMIN) ---
            let url = '/api/acoes';
            const role = localStorage.getItem("userRole");
            const filtroId = localStorage.getItem("superAdminGabineteFilter");
            if (role === "SUPER_ADMIN" && filtroId) {
                url += `?gabineteId=${filtroId}`;
            }
            // -----------------------------------------

            const res = await fetch(url);
            if(!res.ok) return;
            const acoes = await res.json();

            const grupos = groupByCep(acoes);
            const pontosHeat = [];
            infoLayer.clearLayers();

            for (const g of grupos) {
                if (!g.cep) continue;
                const geo = await geocodeSmart(g.cep);

                if (geo) {
                    pontosHeat.push(...jitterPoints(geo.lat, geo.lng, g.count));

                    let aviso = '';
                    let cor = '#2c3e50';

                    if (geo.precisao === 'bairro') {
                        aviso = '<br><strong style="color:#e67e22">(📍 Centro do Bairro)</strong>';
                        cor = '#e67e22';
                    }
                    if (geo.precisao === 'nucleo') {
                        aviso = '<br><strong style="color:#27ae60">(📍 Via Localizada)</strong>';
                    }

                    L.circleMarker([geo.lat, geo.lng], {
                        radius: 12, color: 'transparent', fillColor: '#333', fillOpacity: 0.0
                    }).bindPopup(`
                        <div style="text-align:center; font-family:sans-serif;">
                            <b style="font-size:13px; color:${cor};">${geo.rua || geo.bairro}</b>${aviso}<br>
                            <span style="color:#7f8c8d; font-size:11px;">${geo.bairro} - ${g.cep}</span>
                            <hr style="margin:4px 0; border:0; border-top:1px solid #eee;">
                            <b style="color:#2980b9;">${g.count} Ações</b>
                        </div>
                    `).addTo(infoLayer);
                }
                await new Promise(r => setTimeout(r, 1200));
            }

            if (pontosHeat.length) {
                if (heatLayer) heatLayer.remove();
                heatLayer = L.heatLayer(pontosHeat, {
                    radius: 20, blur: 35, maxZoom: 15, minOpacity: 0.4,
                    gradient: { 0.3: '#2ecc71', 0.6: '#f39c12', 1.0: '#e74c3c' }
                }).addTo(map);
                infoLayer.bringToFront();
            }
        } catch (e) { console.error(e); }
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

    // =================== LÓGICA DE EXTRACTOR DE NOME ===================

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
        const CACHE_KEY = 'geoV12_' + cep;
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

            // TENTATIVA 1: Busca Padrão
            coords = await buscarNominatim({
                street: ruaOriginal,
                city: viaData.localidade,
                state: viaData.uf
            });

            // TENTATIVA 2: Busca Apenas o Núcleo
            if (!coords && nomeNucleo.length > 3) {
                coords = await buscarNominatim({
                    street: nomeNucleo,
                    city: viaData.localidade,
                    state: viaData.uf
                });
                if (coords) precisao = 'nucleo';
            }

            // TENTATIVA 3: Fallback para Bairro
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
                    lat: coords.lat,
                    lng: coords.lng,
                    rua: ruaOriginal,
                    bairro: viaData.bairro,
                    precisao: precisao
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(result));
                return result;
            }

        } catch (e) { console.error("Erro geocode:", e); }
        return null;
    }
});