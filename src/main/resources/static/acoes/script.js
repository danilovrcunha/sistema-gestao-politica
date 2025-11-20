console.log('[Ações] Mapa Inteligente V4');

document.addEventListener('DOMContentLoaded', () => {
    if (!window.L) return;

    // Configurações
    const JITTER_RADIUS = 15;

    // Utils
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    const offsetMeters = (lat, lng, dx, dy) => {
        const dLat = dy / 111111;
        const dLng = dx / (111111 * Math.cos(lat * Math.PI / 180));
        return { lat: lat + dLat, lng: lng + dLng };
    };

    // Jitter: Espalha pontos levemente para não ficarem empilhados
    function jitterPoints(lat, lng, count) {
        if (count <= 1) return [[lat, lng, 1.0]];
        const pts = [];
        const max = Math.min(count, 40);
        for(let i=0; i<max; i++) {
            const r = Math.random() ** 0.6 * (JITTER_RADIUS * Math.sqrt(count));
            const theta = Math.random() * Math.PI * 2;
            const p = offsetMeters(lat, lng, r * Math.cos(theta), r * Math.sin(theta));
            pts.push([p.lat, p.lng, 0.8]);
        }
        return pts;
    }

    // Mapa Base
    const map = L.map('map').setView([-10.9472, -37.0731], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map);

    let heatLayer = null;
    let infoLayer = L.layerGroup().addTo(map);

    // Execução
    montarMapa();

    async function montarMapa() {
        if (!L.heatLayer) return;
        try {
            const res = await fetch('/api/acoes');
            if(!res.ok) return;
            const acoes = await res.json();

            const grupos = groupByCep(acoes);
            const pontosHeat = [];
            infoLayer.clearLayers();

            for (const g of grupos) {
                if (!g.cep) continue;

                // GEOLOCALIZAÇÃO INTELIGENTE
                const geo = await geocodeSmart(g.cep);

                if (geo) {
                    // 1. Mapa de Calor
                    pontosHeat.push(...jitterPoints(geo.lat, geo.lng, g.count));

                    // 2. Marcador de Clique (Rua)
                    L.circleMarker([geo.lat, geo.lng], {
                        radius: 20, color: 'transparent', fillColor: '#000', fillOpacity: 0
                    }).bindPopup(`
                        <div style="text-align:center; font-family:sans-serif;">
                            <b style="font-size:14px; color:#333;">${geo.rua}</b><br>
                            <span style="color:#666; font-size:12px;">CEP: ${g.cep}</span>
                            <hr style="margin:5px 0; border:0; border-top:1px solid #ddd;">
                            <b style="color:#d35400;">${g.count} Ações</b>
                        </div>
                    `).addTo(infoLayer);
                }
                await delay(800); // Respeito à API
            }

            if (pontosHeat.length) {
                if (heatLayer) heatLayer.remove();
                heatLayer = L.heatLayer(pontosHeat, {
                    radius: 25, blur: 20, maxZoom: 17, minOpacity: 0.4,
                    gradient: { 0.3: 'lime', 0.6: 'yellow', 1.0: 'red' }
                }).addTo(map);

                infoLayer.bringToFront();
                const bounds = L.latLngBounds(pontosHeat.map(p=>[p[0],p[1]]));
                map.fitBounds(bounds.pad(0.1));
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

    // A Mágica: ViaCEP (Nome da Rua) + Nominatim (Busca Estruturada)
    async function geocodeSmart(cep) {
        const CACHE_KEY = 'geoV4_' + cep;
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);

        try {
            // A. ViaCEP para garantir o nome correto da rua
            const viaRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const viaData = await viaRes.json();
            if (viaData.erro) return null;

            // B. Nominatim Structured Search
            // Procura especificamente pela RUA e CIDADE
            const url = new URL('https://nominatim.openstreetmap.org/search');
            url.searchParams.set('format', 'jsonv2');
            url.searchParams.set('limit', '1');
            url.searchParams.set('street', viaData.logradouro); // <--- O PULO DO GATO
            url.searchParams.set('city', viaData.localidade);
            url.searchParams.set('state', 'Sergipe');
            url.searchParams.set('country', 'Brazil');

            const nomRes = await fetch(url);
            const nomData = await nomRes.json();

            if (nomData.length > 0) {
                const res = {
                    lat: parseFloat(nomData[0].lat),
                    lng: parseFloat(nomData[0].lon),
                    rua: viaData.logradouro
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(res));
                return res;
            }

            // Fallback: se não achar a rua pelo nome, tenta o CEP direto
            const fbRes = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${cep},Brazil`);
            const fbData = await fbRes.json();
            if(fbData.length > 0) {
                const res = {
                    lat: parseFloat(fbData[0].lat),
                    lng: parseFloat(fbData[0].lon),
                    rua: viaData.logradouro
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(res));
                return res;
            }

        } catch (e) { console.error(e); }
        return null;
    }
});