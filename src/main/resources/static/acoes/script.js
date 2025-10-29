console.log('[Ações] Leaflet + heatmap (auto-geocode + jitter por volume)');

document.addEventListener('DOMContentLoaded', () => {
    if (!window.L) { console.error('Leaflet não carregado.'); return; }

    // ==== helpers ====
    const normalize = s => (s ?? '')
        .toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim();

    const clamp = (min, max, v) => Math.max(min, Math.min(max, v));
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    // aplica deslocamento em METROS a partir de uma lat/lng
    function offsetMeters(lat, lng, dxMeters, dyMeters) {
        const dLat = dyMeters / 111111; // ~111.111 m por grau lat
        const mPerDegLon = 111111 * Math.cos(lat * Math.PI / 180);
        const dLng = dxMeters / mPerDegLon;
        return { lat: lat + dLat, lng: lng + dLng };
    }

    // gera N pontos “jitter” (espalhados) ao redor do centro, com raio em METROS
    function jitterPoints(centerLat, centerLng, count, maxPoints, baseRadiusM) {
        const n = clamp(1, maxPoints, Math.round(count)); // limita qte de pontos
        const pts = [];
        for (let i = 0; i < n; i++) {
            // raio cresce com sqrt(count) pra não explodir
            const R = baseRadiusM * Math.sqrt(count);
            // amostragem polar: distância aleatória tendendo ao centro
            const r = Math.random() ** 0.6 * R; // mais pontos perto do centro
            const theta = Math.random() * Math.PI * 2;
            const dx = r * Math.cos(theta);
            const dy = r * Math.sin(theta);
            const p = offsetMeters(centerLat, centerLng, dx, dy);
            pts.push([p.lat, p.lng, 0.9]); // intensidade alta; densidade faz o “brilho”
        }
        return pts;
    }

    // centros de cidades (fallback quando geocode falhar)
    const CITY_CENTER = {
        [normalize('Aracaju')]:   { lat: -10.9472, lng: -37.0731 },
        [normalize('Lagarto')]:   { lat: -10.9128, lng: -37.6689 },
        [normalize('Itabaiana')]: { lat: -10.6869, lng: -37.4273 }
    };

    // ==== 1) mapa base (sempre aparece) ====
    const initial = CITY_CENTER[normalize('Aracaju')];
    const map = L.map('map', { zoomControl: true, minZoom: 5 });
    map.setView([initial.lat, initial.lng], 12);

    // tiles com fallback
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OSM contributors'
    });
    const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM & CARTO'
    });
    let base = osm.addTo(map);
    base.on('tileerror', () => { try { map.removeLayer(base); } catch{} base = carto.addTo(map); });

    map.whenReady(() => setTimeout(() => map.invalidateSize(), 100));

    // Controles
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => map.zoomIn());
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => map.zoomOut());

    let heatLayer = null;
    let lastLatLngs = [];

    document.getElementById('btn-fit')?.addEventListener('click', () => {
        if (!lastLatLngs.length) return;
        map.fitBounds(L.latLngBounds(lastLatLngs).pad(0.25));
    });

    // raio dinâmico conforme zoom (mais zoom => menor raio)
    function currentRadius() {
        const z = map.getZoom();
        return clamp(6, 24, 18 - (z - 12) * 2);
    }
    map.on('zoomend', () => {
        if (heatLayer) heatLayer.setOptions({ radius: currentRadius() });
    });

    // ==== 2) heatmap só se houver ações ====
    montarHeat().catch(err => console.error('[Heat] erro:', err));

    async function montarHeat() {
        if (!L.heatLayer) { console.warn('leaflet.heat não carregado.'); return; }

        const acoes = await carregarAcoes();                // [{cidade,bairro,...}]
        const grupos = groupByBairro(acoes);                // [{cidade,bairro,count}, ...]

        // geocodifica (com cache) cada bairro e gera “jitter” proporcional ao volume
        const pontosJitter = [];
        for (const g of grupos) {
            const cidadeK = normalize(g.cidade);
            const bairroK = normalize(g.bairro);
            if (!cidadeK || !bairroK) continue;

            const centroCidade = CITY_CENTER[cidadeK] || initial;
            const coord = await geocodeBairroBBox(g.bairro, g.cidade, centroCidade);

            const base = coord || CITY_CENTER[cidadeK];
            if (base) {
                // até 25 pontos por bairro; base de 45m de raio
                const pts = jitterPoints(base.lat, base.lng, g.count, 25, 45);
                pontosJitter.push(...pts);
            }

            // respeita Nominatim (~1 req/s) — só quando precisamos geocodificar
            await delay(1100);
        }

        if (!pontosJitter.length) return;

        // cria (ou recria) o heat
        if (heatLayer) heatLayer.remove();
        heatLayer = L.heatLayer(pontosJitter, {
            radius: currentRadius(),
            blur: 12,
            maxZoom: 17,
            minOpacity: 0.45,
            gradient: {
                0.2: 'rgba(255,120,120,0.6)',
                0.4: 'rgba(255,80,80,0.7)',
                0.6: 'rgba(255,40,40,0.8)',
                0.8: 'rgba(255,0,0,0.9)',
                1.0: 'rgba(160,0,0,1)'
            }
        }).addTo(map);

        lastLatLngs = pontosJitter.map(([lat, lng]) => L.latLng(lat, lng));
        map.fitBounds(L.latLngBounds(lastLatLngs).pad(0.25));
    }

    // ==== geocodificação automática com cache (14 dias) ====
    async function geocodeBairroBBox(bairro, cidade, centro) {
        const CACHE_KEY = 'geoCacheBairroAutoV3';
        const TTL_MS = 14 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        let cache = {};
        try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { cache = {}; }

        // limpa expirados
        for (const k of Object.keys(cache)) {
            if (!cache[k] || (now - (cache[k].ts || 0)) > TTL_MS) delete cache[k];
        }

        const key = `${normalize(bairro)}|${normalize(cidade)}`;
        if (cache[key]) return cache[key];

        // bounding box em torno da cidade (±0.12º ~ 13 km aprox.)
        const lat = centro.lat, lng = centro.lng;
        const d = 0.12;
        const viewbox = `${lng - d},${lat + d},${lng + d},${lat - d}`; // lon_min,lat_max,lon_max,lat_min

        // Nominatim dentro do bbox
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('limit', '1');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('countrycodes', 'br');
        url.searchParams.set('bounded', '1');
        url.searchParams.set('viewbox', viewbox);
        url.searchParams.set('q', `${bairro}, ${cidade}, Sergipe, Brasil`);

        try {
            const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
            if (!res.ok) return null;
            const data = await res.json();
            if (Array.isArray(data) && data.length) {
                const item = data[0];
                const latNum = parseFloat(item.lat);
                const lonNum = parseFloat(item.lon);
                if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
                    const val = { lat: latNum, lng: lonNum, ts: now };
                    cache[key] = val;
                    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
                    return val;
                }
            }
            return null;
        } catch {
            return null;
        }
    }

    // ==== utils ====
    async function carregarAcoes() {
        const res = await fetch('/api/acoes', { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`GET /api/acoes -> ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error('Resposta não-JSON em /api/acoes');
        return res.json();
    }

    function groupByBairro(acoes) {
        const m = new Map();
        for (const a of acoes) {
            const cidade = normalize(a.cidade);
            const bairro = normalize(a.bairro);
            if (!cidade || !bairro) continue;
            const key = `${cidade}|${bairro}`;
            const atual = m.get(key) || { cidade, bairro, count: 0 };
            atual.count += 1;
            m.set(key, atual);
        }
        return Array.from(m.values());
    }
});
