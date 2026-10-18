// app.js

// 1. JWT Authentication Check (Session + LocalStorage fallback with Token Expiration Check)
const token = sessionStorage.getItem("mfp_token") || localStorage.getItem("mfp_token");
const userStr = sessionStorage.getItem("mfp_user") || localStorage.getItem("mfp_user");

function isTokenValid(tokenStr) {
    if (!tokenStr) return false;
    try {
        const parts = tokenStr.split('.');
        if (parts.length !== 3) return false;
        let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        const payload = JSON.parse(atob(b64));
        if (payload.exp && Date.now() >= payload.exp * 1000) return false;
        return true;
    } catch(e) {
        return false;
    }
}

function clearAuthAndRedirect() {
    sessionStorage.removeItem("mfp_token");
    sessionStorage.removeItem("mfp_user");
    localStorage.removeItem("mfp_token");
    localStorage.removeItem("mfp_user");
    window.location = "login.html";
}

if (!token || !userStr || !isTokenValid(token)) {
    clearAuthAndRedirect();
} else {
    try {
        const user = JSON.parse(userStr);
        const nameEl = document.getElementById("userNameDisplay");
        if (nameEl) nameEl.textContent = user.name || "User";
        const pillEl = document.getElementById("userPill");
        if (pillEl) pillEl.style.display = "flex";
        
        const parts = token.split('.');
        if (parts.length === 3) {
            let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4) b64 += '=';
            const payload = JSON.parse(atob(b64));
            if (payload && payload.role === 'admin') {
                const adminLink = document.getElementById("adminLink");
                if (adminLink) adminLink.style.display = "inline-flex";
            }
        }
    } catch(e) {
        console.warn("Non-fatal session UI update:", e);
    }
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.onclick = () => {
        clearAuthAndRedirect();
    };
}

// 2. High-Fidelity Multi-Layer Map Logic
let map;

function triggerMapResize() {
    if (map) {
        map.invalidateSize();
    }
}

window.addEventListener('resize', triggerMapResize);
window.addEventListener('orientationchange', () => setTimeout(triggerMapResize, 250));

document.addEventListener('DOMContentLoaded', function() {
    // ── Mobile init: Open Controls tab by default on mobile so user can select cities immediately! ──
    if (window.innerWidth <= 820) {
        switchMobileTab('controls');
    }

    try {
        // High-Fidelity Detailed Tile Layers (100% Free, No API Key Required)
        // 1. Detailed Streets: OpenStreetMap — Complete street & highway grid across Maharashtra
        const detailedStreets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        // 2. Satellite Hybrid: Real high-res satellite imagery + transportation & city name overlays
        const satelliteImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: '&copy; Esri, Maxar, Earthstar Geographics'
        });
        const satelliteLabels = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19
        });
        const satelliteHybrid = L.layerGroup([satelliteImagery, satelliteLabels]);

        // 3. Dark Matrix: Esri Canvas Dark Gray + crisp night navigation labels (No API Key needed)
        const darkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 16,
            attribution: '&copy; Esri, DeLorme, NAVTEQ'
        });
        const darkLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 16
        });
        const darkMatrix = L.layerGroup([darkBase, darkLabels]);

        // 4. Topographic Terrain: Detailed elevation relief, rivers, landmarks & roads
        const topoTerrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: '&copy; Esri, DeLorme, USGS, TomTom'
        });

        const initialZoom = window.innerWidth <= 768 ? 6.5 : 7;
        map = L.map('map', {
            center: [19.4, 75.8],
            zoom: initialZoom,
            zoomSnap: 0.5,
            zoomControl: false,
            scrollWheelZoom: false,
            layers: [detailedStreets],
            attributionControl: true
        });

        // Layer Switcher Control (Detailed Streets / Satellite Hybrid / Dark Matrix / Topo Terrain)
        const baseLayers = {
            "🗺️ Detailed Streets": detailedStreets,
            "🛰️ Satellite Hybrid": satelliteHybrid,
            "🌙 Dark Matrix": darkMatrix,
            "🏔️ Topo Terrain": topoTerrain
        };
        L.control.layers(baseLayers, null, { position: 'topright' }).addTo(map);
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Aggressive invalidation so mobile browsers NEVER render blank or gray tiles
        triggerMapResize();
        setTimeout(triggerMapResize, 100);
        setTimeout(triggerMapResize, 350);
        setTimeout(triggerMapResize, 800);
        setTimeout(triggerMapResize, 1500);

        if (window.ResizeObserver) {
            const mapEl = document.getElementById('map');
            if (mapEl) {
                new ResizeObserver(() => triggerMapResize()).observe(mapEl);
            }
        }

        addCity(); addCity();

        // Horizontal Route Topology Carousel Scroll Controls
        const track = document.getElementById('svgHorizontalTrack');
        const leftBtn = document.getElementById('scrollTopologyLeft');
        const rightBtn = document.getElementById('scrollTopologyRight');
        if (leftBtn && track) {
            leftBtn.onclick = () => track.scrollBy({ left: -480, behavior: 'smooth' });
        }
        if (rightBtn && track) {
            rightBtn.onclick = () => track.scrollBy({ left: 480, behavior: 'smooth' });
        }
    } catch(e) {
        let errDisplay = document.getElementById('errorDisplay');
        if(errDisplay) errDisplay.innerHTML = '⚠️ Map core error: ' + (e.message || e);
    }
});

let markers = [], lines = [];
let routeLayers = [];
let routingControl = null;

function clearMap() {
    if(!map) return;
    markers.forEach(m => map.removeLayer(m));
    lines.forEach(l => map.removeLayer(l));
    routeLayers.forEach(l => map.removeLayer(l));
    if (routingControl) map.removeControl(routingControl);
    
    markers = []; lines = []; routeLayers = []; routingControl = null;
    
    let strct = document.getElementById('analysisSplit');
    if(strct) strct.style.display = 'none';
    let pnl = document.getElementById('analyticsHUD');
    if(pnl) pnl.style.display = 'none';
    let errDisp = document.getElementById('errorDisplay');
    if(errDisp) errDisp.innerHTML = '';
    // Hide Results tab on mobile
    const tabAnalysisBtn = document.getElementById('tabAnalysisBtn');
    if (tabAnalysisBtn) tabAnalysisBtn.style.display = 'none';
    // Hide map info badge
    const mapInfoBadge = document.getElementById('mapInfoBadge');
    if (mapInfoBadge) mapInfoBadge.style.display = 'none';
    // Hide mobile map scroll button
    const mobileMapScrollBtn = document.getElementById('mobileMapScrollBtn');
    if (mobileMapScrollBtn) mobileMapScrollBtn.style.display = 'none';
}

// ── Mobile Tab Switcher ──
function switchMobileTab(tab) {
    const sidebar = document.getElementById('sidebarPanel');
    const mapArea = document.getElementById('mapArea');
    const analysisSplit = document.getElementById('analysisSplit');
    const analyticsHUD = document.getElementById('analyticsHUD');
    const mobileResultsAnchor = document.getElementById('mobileResultsAnchor');

    const tabMap = document.getElementById('tabMapBtn');
    const tabCtrl = document.getElementById('tabControlsBtn');
    const tabAnalysis = document.getElementById('tabAnalysisBtn');

    // Reset active
    [tabMap, tabCtrl, tabAnalysis].forEach(b => b && b.classList.remove('active'));

    if (tab === 'map') {
        if (sidebar) sidebar.classList.add('mobile-hidden');
        if (mapArea) mapArea.classList.remove('mobile-hidden');
        if (tabMap) tabMap.classList.add('active');
        // Force immediate and smooth tile updates
        triggerMapResize();
        setTimeout(triggerMapResize, 100);
        setTimeout(triggerMapResize, 350);
    } else if (tab === 'controls') {
        if (mapArea) mapArea.classList.add('mobile-hidden');
        if (sidebar) sidebar.classList.remove('mobile-hidden');
        if (tabCtrl) tabCtrl.classList.add('active');
    } else if (tab === 'analysis') {
        // Show map area (hide sidebar), then scroll to analytics (comes first)
        if (sidebar) sidebar.classList.add('mobile-hidden');
        if (mapArea) mapArea.classList.remove('mobile-hidden');
        if (tabAnalysis) tabAnalysis.classList.add('active');
        setTimeout(() => {
            const anchor = document.getElementById('analyticsHUD') || document.getElementById('mobileResultsAnchor');
            if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// Smooth scroll to results for mobile
function scrollToAnalysisSection() {
    const anchor = document.getElementById('analyticsHUD') || document.getElementById('mobileResultsAnchor') || document.getElementById('analysisSplit');
    if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function addCity() {
    let container = document.getElementById('inputs');
    if(!container) return;
    let rowId = 'row_' + Date.now() + Math.floor(Math.random() * 100);
    let div = document.createElement('div');
    div.className = 'city-row';
    div.id = rowId;
    div.innerHTML = `
        <div class="autocomplete-wrapper">
            <input type="text" placeholder="Type city or village..." class="city-input" autocomplete="off">
            <div class="autocomplete-dropdown"></div>
        </div>
        <button class="delete-city"><i class="ri-delete-bin-line"></i></button>
    `;
    
    let input = div.querySelector('.city-input');
    let dropdown = div.querySelector('.autocomplete-dropdown');
    
    let debounceTimer;
    input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        let val = e.target.value;
        div.removeAttribute('data-lat');
        div.removeAttribute('data-lon');
        div.removeAttribute('data-name');
        
        if(val.length < 3) {
            dropdown.style.display = 'none';
            return;
        }
        dropdown.innerHTML = `<div style="padding:15px; color: #a0a0a0; font-size:12px; text-align:center;"><i class="ri-loader-4-line ri-spin"></i> Searching OpenStreetMap...</div>`;
        dropdown.style.display = 'block';
        
        debounceTimer = setTimeout(async () => {
            try {
                let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5`);
                let data = await res.json();
                dropdown.innerHTML = '';
                if(data.length === 0) {
                    dropdown.innerHTML = `<div style="padding:15px; color: #ef4444; font-size:12px; text-align:center;">No results found.</div>`;
                    return;
                }
                
                data.forEach(item => {
                    let type = item.type || item.class;
                    let address = item.address || {};
                    let icon = type === 'city' ? 'ri-building-2-line' : (type === 'village' ? 'ri-home-smile-line' : 'ri-map-pin-line');
                    let state = address.state || address.county || '';
                    let country = address.country || '';
                    let title = address.city || address.town || address.village || item.name;
                    
                    let itemDiv = document.createElement('div');
                    itemDiv.className = 'autocomplete-item';
                    itemDiv.innerHTML = `
                        <i class="${icon} ac-icon"></i>
                        <div class="ac-text">
                            <span class="ac-main">${title}</span>
                            <span class="ac-sub" style="text-transform:capitalize;">${type} • ${state ? state+', ' : ''}${country}</span>
                        </div>
                    `;
                    itemDiv.onclick = () => {
                        input.value = title;
                        div.dataset.lat = item.lat;
                        div.dataset.lon = item.lon;
                        div.dataset.name = title;
                        dropdown.style.display = 'none';
                        updateSelects();
                        highlightOnMap(item.lat, item.lon, title, type);
                    };
                    dropdown.appendChild(itemDiv);
                });
            } catch(err) {
                 dropdown.innerHTML = `<div style="padding:15px; color: #ef4444; font-size:12px; text-align:center;">Search failed.</div>`;
            }
        }, 500);
    });

    document.addEventListener('click', (e) => {
        if(!div.contains(e.target)) dropdown.style.display = 'none';
    });

    div.querySelector('.delete-city').onclick = () => { div.remove(); updateSelects(); };
    container.appendChild(div);
}

function highlightOnMap(lat, lon, title, type) {
    if(!map) return;
    let m = L.circleMarker([lat, lon], {
        radius: 8, fillColor: "#3b82f6", color: "#ffffff", weight: 2, opacity: 1, fillOpacity: 1
    }).addTo(map);
    m.bindTooltip(title, {direction: "top", className: "city-label-map", offset: [0, -12]});
    
    map.flyTo([lat, lon], 10, {animate: true, duration: 1});
    markers.push(m);
}

function updateSelects() {
    let validRows = document.querySelectorAll('#inputs .city-row');
    let names = [];
    validRows.forEach(row => { if(row.dataset.name) names.push(row.dataset.name); });
    
    // Update hub count badge in mobile nav
    const badge = document.getElementById('hubCountBadge');
    if (badge) badge.textContent = validRows.length;

    let s = document.getElementById('start');
    let e = document.getElementById('end');
    if(!s || !e) return;
    s.innerHTML = '<option value="">Select start</option>';
    e.innerHTML = '<option value="">Select end</option>';
    names.forEach(n => { s.add(new Option(n,n)); e.add(new Option(n,n)); });
}

function haversine(lat1,lon1,lat2,lon2) {
    const R = 6371;
    let dLat = (lat2-lat1)*Math.PI/180;
    let dLon = (lon2-lon1)*Math.PI/180;
    let a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function greedy(m, start, end) {
    let n = m.length, vis = Array(n).fill(false), path = [start];
    vis[start] = true;
    let cur = start;
    while(true) {
        let next = -1, best = Infinity;
        for(let i=0; i<n; i++) {
            if(!vis[i] && (start!=end ? i!=end : true) && m[cur][i] < best) {
                best = m[cur][i];
                next = i;
            }
        }
        if(next==-1) break;
        vis[next]=true;
        path.push(next);
        cur = next;
    }
    if(start != end) path.push(end);
    else if(path[path.length-1] != start) path.push(start);
    return path;
}

function tspDP(m, start, end) {
    let n = m.length, dp = {}, parent = {}, VIS = 1<<n;
    for(let mask=0; mask<VIS; mask++) for(let i=0; i<n; i++) dp[mask+','+i] = Infinity;
    dp[(1<<start)+','+start] = 0;
    for(let mask=0; mask<VIS; mask++) {
        for(let u=0; u<n; u++) {
            let key = mask+','+u;
            if(dp[key]===Infinity) continue;
            for(let v=0; v<n; v++) {
                if(mask & (1<<v)) continue;
                let nextMask = mask | (1<<v);
                let newCost = dp[key] + m[u][v];
                let k = nextMask+','+v;
                if(newCost < dp[k]) {
                    dp[k] = newCost;
                    parent[k] = u+','+mask;
                }
            }
        }
    }
    let finalMask = VIS-1, best = Infinity, last = -1;
    if(start == end && n > 1) {
        for(let i=0; i<n; i++) {
            if(i==start) continue;
            let cost = dp[finalMask+','+i] + m[i][start];
            if(cost<best) { best=cost; last=i; }
        }
    } else {
        for(let i=0; i<n; i++) {
            let cost = dp[finalMask+','+i] + m[i][end];
            if(cost<best) { best=cost; last=i; }
        }
    }
    let path = (start==end) ? [start] : [end];
    let mask = finalMask, cur = last;
    while(cur != start && cur != -1) {
        path.unshift(cur);
        let pStr = parent[mask+','+cur];
        if(!pStr) break;
        let p = pStr.split(',');
        cur = parseInt(p[0]);
        mask = parseInt(p[1]);
    }
    if(path[0] !== start) path.unshift(start);
    if(start==end && path[path.length-1]!=start) path.push(start);
    return path;
}

async function getRoadRoute(a,b) {
    try {
        let url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`;
        let res = await fetch(url);
        let data = await res.json();
        if(data.routes && data.routes[0]) {
             let r = data.routes[0];
             return {
                 coords: r.geometry.coordinates.map(c=>[c[1],c[0]]),
                 distance: r.distance / 1000,
                 duration: r.duration / 60
             };
        }
    } catch(e) {}
    let hdist = haversine(a[0],a[1], b[0],b[1]);
    return {
        coords: [[a[0],a[1]],[b[0],b[1]]],
        distance: hdist,
        duration: Math.floor(hdist*1.2)
    };
}

async function drawRoute(path, coords, color, routeName) {
    let totalRoad = 0;
    let totalAerial = 0;
    let latlngs = [];
    let segmentsData = [];
    
    // Process segments sequentially
    for(let i=0; i<path.length-1; i++) {
        let fromPt = coords[path[i]];
        let toPt = coords[path[i+1]];
        
        let aerialSegment = haversine(fromPt[0], fromPt[1], toPt[0], toPt[1]);
        totalAerial += aerialSegment;
        
        let rd = await getRoadRoute(fromPt, toPt);
        let route = rd.coords;
        if(route.length) {
            let poly = L.polyline(route, {color, weight:6, opacity:0.9}).addTo(map);
            latlngs.push(...route);
            lines.push(poly);
            totalRoad += rd.distance;
            segmentsData.push({fromIdx: path[i], toIdx: path[i+1], distance: rd.distance, duration: rd.duration, aerial: aerialSegment});
        }
    }
    
    let interactionArea = null;
    if (latlngs.length > 0 && routeName) {
        // Creates a thick overlay strictly for catching hover events
        interactionArea = L.polyline(latlngs, {color: 'transparent', weight: 25}).addTo(map);
        lines.push(interactionArea);
    }
    
    return {totalRoad, totalAerial, segmentsData, interactionArea, color, routeName};
}

function displayMatrix(names, m) {
    let el = document.getElementById('matrix');
    if(!el) return;
    let html = "<table><tr><th>City</th>";
    names.forEach(n => html += "<th>"+n+"</th>");
    html += "</tr>";
    for(let i=0; i<names.length; i++) {
        html += "<tr><th>"+names[i]+"</th>";
        for(let j=0; j<names.length; j++) html += "<td>"+m[i][j].toFixed(1)+"</td>";
        html += "</tr>";
    }
    html += "</table>";
    el.innerHTML = html;
}

function drawSVGGraph(svgId, path, names, m) {
    let svg = document.getElementById(svgId);
    if(!svg) return;
    
    // Attempt to salvage the pre-existing marker if it isn't dynamically built
    let defs = svg.querySelector('defs');
    svg.innerHTML = '';
    if(!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg","defs");
    }
    
    // Create perfectly matched geometric color mapping
    let clr = svgId==='graphOptimal' ? "#fb923c" : svgId==='graphGreedy' ? "#10b981" : svgId==='graphTotal' ? "#94a3b8" : "#60a5fa";

    // Setup arrow marker dynamically
    let markerId = "arrow-" + svgId;
    let marker = document.createElementNS("http://www.w3.org/2000/svg","marker");
    marker.setAttribute("id", markerId);
    marker.setAttribute("markerWidth", "12");
    marker.setAttribute("markerHeight", "12");
    marker.setAttribute("refX", "30");
    marker.setAttribute("refY", "6");
    marker.setAttribute("orient", "auto");
    
    let pathArrow = document.createElementNS("http://www.w3.org/2000/svg","polyline");
    pathArrow.setAttribute("points", "0,0 8,6 0,12");
    pathArrow.setAttribute("fill", "none");
    pathArrow.setAttribute("stroke", clr);
    pathArrow.setAttribute("stroke-width", "3");
    marker.appendChild(pathArrow);
    defs.innerHTML = ''; 
    defs.appendChild(marker);
    svg.appendChild(defs);

    let n = path.length;
    let uniqueNodes = [...new Set(path)];
    let numUnique = uniqueNodes.length;

    // Viewport coordinates with generous margins so city labels never crop
    const vbWidth = 560;
    const vbHeight = 360;
    const cx = vbWidth / 2;
    const cy = vbHeight / 2;
    const rx = 180;
    const ry = 110;

    // Position each unique city on an ellipse so edges and labels never bunch up
    let positions = {};
    for (let i = 0; i < numUnique; i++) {
        let nodeIdx = uniqueNodes[i];
        let angle = (i / numUnique) * 2 * Math.PI - Math.PI / 2;
        let x = cx + rx * Math.cos(angle);
        let y = cy + ry * Math.sin(angle);
        positions[nodeIdx] = { x, y, angle };
    }

    svg.setAttribute("viewBox", `0 0 ${vbWidth} ${vbHeight}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    // 1. Draw connecting lines with arrow markers & distance pills
    for(let i=0; i<path.length-1; i++) {
        let f = positions[path[i]];
        let t = positions[path[i+1]];
        if(!f || !t) continue;
        
        let line = document.createElementNS("http://www.w3.org/2000/svg","line");
        line.setAttribute("x1", f.x); line.setAttribute("y1", f.y);
        line.setAttribute("x2", t.x); line.setAttribute("y2", t.y);
        line.setAttribute("stroke", clr);
        line.setAttribute("stroke-width", "3.5");
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("marker-end", `url(#${markerId})`);
        svg.appendChild(line);

        // Distance label with pill background
        let midX = (f.x + t.x) / 2;
        let midY = (f.y + t.y) / 2;
        let distKm = m[path[i]][path[i+1]].toFixed(1) + " km";

        // Label pill background
        let pillBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        pillBg.setAttribute("x", midX - 32);
        pillBg.setAttribute("y", midY - 14);
        pillBg.setAttribute("width", "64");
        pillBg.setAttribute("height", "18");
        pillBg.setAttribute("rx", "6");
        pillBg.setAttribute("fill", "#050914");
        pillBg.setAttribute("stroke", "rgba(255,255,255,0.15)");
        pillBg.setAttribute("stroke-width", "1");
        svg.appendChild(pillBg);

        let lbl = document.createElementNS("http://www.w3.org/2000/svg","text");
        lbl.setAttribute("x", midX); 
        lbl.setAttribute("y", midY - 1);
        lbl.setAttribute("fill", "#cbd5e1");
        lbl.setAttribute("font-size", "11");
        lbl.setAttribute("font-weight", "700");
        lbl.setAttribute("font-family", "'Outfit', sans-serif");
        lbl.setAttribute("text-anchor", "middle");
        lbl.textContent = distKm;
        svg.appendChild(lbl);
    }

    // 2. Draw nodes (circles + step number) & outward radial labels
    for(let i=0; i<path.length; i++) {
        let nodeIdx = path[i];
        let p = positions[nodeIdx];
        if(!p) continue;
        
        // Only draw node circle once per unique city
        if (svg.querySelector(`circle[data-node="${nodeIdx}"]`)) continue;

        let circ = document.createElementNS("http://www.w3.org/2000/svg","circle");
        circ.setAttribute("cx", p.x); 
        circ.setAttribute("cy", p.y); 
        circ.setAttribute("r", "22");
        circ.setAttribute("fill", "#0d1322");
        circ.setAttribute("stroke", clr);
        circ.setAttribute("stroke-width", "3.5");
        circ.setAttribute("data-node", nodeIdx);
        svg.appendChild(circ);

        // Step number inside circle
        let step = document.createElementNS("http://www.w3.org/2000/svg","text");
        step.setAttribute("x", p.x); 
        step.setAttribute("y", p.y + 5);
        step.setAttribute("fill", "#ffffff"); 
        step.setAttribute("font-size", "14");
        step.setAttribute("font-family", "'Outfit', sans-serif");
        step.setAttribute("font-weight", "800"); 
        step.setAttribute("text-anchor", "middle");
        step.textContent = i + 1;
        svg.appendChild(step);

        // City name placed radially outside the circle with stroke background
        let textDist = 34;
        let lx = p.x + textDist * Math.cos(p.angle);
        let ly = p.y + textDist * Math.sin(p.angle) + 4;
        let anchor = "middle";
        if (Math.cos(p.angle) > 0.3) anchor = "start";
        else if (Math.cos(p.angle) < -0.3) anchor = "end";

        let txt = document.createElementNS("http://www.w3.org/2000/svg","text");
        txt.setAttribute("x", lx); 
        txt.setAttribute("y", ly);
        txt.setAttribute("fill", "#f8fafc"); 
        txt.setAttribute("font-family", "'Outfit', sans-serif");
        txt.setAttribute("font-size", "13"); 
        txt.setAttribute("font-weight", "700");
        txt.setAttribute("text-anchor", anchor);
        txt.setAttribute("paint-order", "stroke fill");
        txt.setAttribute("stroke", "#060911");
        txt.setAttribute("stroke-width", "4px");
        txt.textContent = names[nodeIdx];
        svg.appendChild(txt);
    }
}

// FORMAT TIME HELPER
function formatTime(mins) {
    if(!mins || mins===0) return "Unknown";
    let h = Math.floor(mins/60);
    let m = Math.floor(mins%60);
    return (h>0 ? h+"h " : "") + m+"m";
}

// COMPACT BREAKDOWN GENERATOR CARD
function renderBreakdown(segmentsData, names, totalDist, title, color, icon) {
    let container = document.getElementById("breakdownContainer");
    if (!container) return;
    
    let html = `
        <div class="route-card glass-panel" style="padding: 24px; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <div>
                   <h3 style="font-size:18px; color:${color}; font-weight:700; display:flex; gap:8px; align-items:center;"><i class="${icon}"></i> ${title}</h3>
                </div>
                <div style="text-align:right;">
                   <div style="font-size:24px; font-weight:800; font-family:'Outfit'; color:#fff;">${totalDist.toFixed(1)} km</div>
                </div>
            </div>
            
            <div style="margin-top:20px; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px;">
    `;
    
    let totalMins = 0;
    segmentsData.forEach((seg, idx) => {
        let fromName = names[seg.fromIdx];
        let toName = names[seg.toIdx];
        totalMins += seg.duration;
        
        html += `
            <div class="route-leg" style="padding:12px 0;">
                <div style="width: 30px; font-size:15px; font-weight:bold; color:var(--text-muted); font-family:'Outfit';">#${idx+1}</div>
                <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                         <span style="font-weight:600; color:#f8fafc; font-size:14px;">${fromName}</span>
                         <i class="ri-arrow-right-line" style="color:var(--brand-secondary); font-size:13px;"></i>
                         <span style="font-weight:600; color:#f8fafc; font-size:14px;">${toName}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:15px; font-weight:700; color:#fff; font-family:'Outfit';">${seg.distance.toFixed(1)} km</div>
                    <div style="font-size:12px; color:#94a3b8; margin-top:2px;"><i class="ri-timer-line"></i> ${formatTime(seg.duration)}</div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    container.innerHTML = html;
}

// ENHANCED STEP-BY-STEP JOURNEY ROADMAP (Kahan se Kahan jana hai)
function renderJourneyRoadmap(segmentsData, names, totalDist, title, color, finalPathLogic) {
    let container = document.getElementById("journeySequenceContainer");
    if (!container) return;

    let totalMins = segmentsData.reduce((acc, seg) => acc + (seg.duration || 0), 0);
    let startCity = names[finalPathLogic[0]];

    let html = `
        <div class="journey-timeline-card">
            <!-- Summary Stats -->
            <div class="journey-summary-bar">
                <div class="journey-summary-item">
                    <span class="journey-summary-label">Route Origin</span>
                    <span class="journey-summary-val" style="color:#10b981; font-size:14px;"><i class="ri-map-pin-2-fill"></i> ${startCity}</span>
                </div>
                <div class="journey-summary-item">
                    <span class="journey-summary-label">Total Distance</span>
                    <span class="journey-summary-val" style="color:${color}; font-size:15px;">${totalDist.toFixed(1)} km</span>
                </div>
                <div class="journey-summary-item">
                    <span class="journey-summary-label">Est. Drive Time</span>
                    <span class="journey-summary-val" style="font-size:14px;"><i class="ri-time-line"></i> ${formatTime(totalMins)}</span>
                </div>
            </div>

            <!-- Vertical Timeline -->
            <div class="journey-timeline-list">
    `;

    let accumulatedKm = 0;
    for (let i = 0; i < finalPathLogic.length; i++) {
        let cityIdx = finalPathLogic[i];
        let cityName = names[cityIdx];
        let isStart = i === 0;
        let isEnd = i === finalPathLogic.length - 1;

        let markerClass = isStart ? "marker-start" : (isEnd ? "marker-end" : "marker-mid");
        let markerIcon = isStart ? '<i class="ri-flag-2-fill"></i>' : (isEnd ? '<i class="ri-trophy-fill"></i>' : i + 1);
        let badgeStyle = isStart 
            ? 'background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3);'
            : (isEnd 
                ? 'background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.3);'
                : 'background:rgba(251,146,60,0.12); color:#fb923c; border:1px solid rgba(251,146,60,0.25);');
        let badgeText = isStart ? 'Start Origin' : (isEnd ? 'Final Arrival' : `Waypoint #${i+1}`);

        // Segment to next stop
        let legInfo = '';
        if (i < segmentsData.length) {
            let seg = segmentsData[i];
            accumulatedKm += seg.distance;
            legInfo = `
                <div style="margin-top:8px; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; font-size:12px;">
                    <span class="timeline-leg-indicator">
                        <i class="ri-arrow-down-line"></i> Next: <strong>${seg.distance.toFixed(1)} km</strong>
                    </span>
                    <span style="color:#94a3b8;"><i class="ri-car-line"></i> ~${formatTime(seg.duration)}</span>
                </div>
            `;
        }

        html += `
            <div class="timeline-step">
                <div class="timeline-marker ${markerClass}">
                    ${markerIcon}
                </div>
                <div class="timeline-content">
                    <div class="timeline-city-row">
                        <span class="timeline-city-name">${cityName}</span>
                        <span class="timeline-badge" style="${badgeStyle}">${badgeText}</span>
                    </div>
                    <div class="timeline-meta">
                        <span><i class="ri-route-line"></i> Route Progression: ${accumulatedKm.toFixed(1)} km</span>
                    </div>
                    ${legInfo}
                </div>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// MAIN RUN FUNCTION
async function run() {
    if(!map) { alert("Map loading..."); return; }
    
    let validRows = document.querySelectorAll('#inputs .city-row');
    let coords = [];
    let names = [];
    
    validRows.forEach(row => {
        let lat = row.dataset.lat;
        let lon = row.dataset.lon;
        let name = row.dataset.name;
        if(lat && lon && name) {
            coords.push([parseFloat(lat), parseFloat(lon)]);
            names.push(name);
        }
    });

    if(names.length < 2) { alert("Please type and select at least 2 valid cities from the precise dropdown suggestions."); return; }

    let startCity = document.getElementById('start').value;
    let endCity = document.getElementById('end').value;
    if(!startCity || !endCity) { alert("Please choose your start and end points via the bottom dropdown filters."); return; }

    clearMap();

    for(let i=0; i<coords.length; i++) {
        let c = coords[i];
        let n = names[i];
        let dot = L.circleMarker(c, {
            radius: 8, fillColor: n===startCity ? "#fb923c" : "#10b981", color: "#ffffff", weight: 2, opacity: 1, fillOpacity: 1
        }).addTo(map);
        dot.bindTooltip(n, {direction: "top", className: "city-label-map", offset: [0, -12]});
        markers.push(dot);
    }
    
    if(coords.length) map.fitBounds(L.latLngBounds(coords), {padding: [50, 50]});

    let straight = [];
    for(let i=0; i<coords.length; i++) {
        straight[i] = [];
        for(let j=0; j<coords.length; j++)
            straight[i][j] = i===j ? 0 : haversine(coords[i][0],coords[i][1], coords[j][0],coords[j][1]);
    }

    displayMatrix(names, straight);

    let sIdx = names.indexOf(startCity);
    let eIdx = names.indexOf(endCity);

    let normal = [...Array(names.length).keys()];
    if(startCity === endCity) normal.push(normal[0]); 
    let greedyPath = greedy(straight, sIdx, eIdx);
    let optimalPath = tspDP(straight, sIdx, eIdx);

    let errDisp = document.getElementById('errorDisplay');
    if(errDisp) errDisp.innerHTML = '<span class="loading"><i class="ri-loader-4-line ri-spin"></i> Processing matrix vectors...</span>';

    // Different colors for different strategies
    let r1 = await drawRoute(normal, coords, '#475569', 'Original Order (Base)');
    let r2 = await drawRoute(greedyPath, coords, '#10b981', 'Fastest Path Logic');
    let r3 = await drawRoute(optimalPath, coords, '#fb923c', 'Recommended Route');

    if(errDisp) errDisp.innerHTML = '';
    
    let d1 = r1.totalRoad, d2 = r2.totalRoad, d3 = r3.totalRoad;
    let best = Math.min(d1,d2,d3);
    let bestName = best===d1 ? 'Original Flow' : best===d2 ? 'Fastest Path' : 'Recommended Optimal';

    // REVEAL BOTTOM HUD SECTIONS
    document.getElementById('analysisSplit').style.display = 'block';
    document.getElementById('analyticsHUD').style.display = 'block';

    let compareEl = document.getElementById('compare');
    if (compareEl) {
        compareEl.innerHTML = `
            <div style="padding:16px; background:rgba(255,195,113,0.1); border:1px solid rgba(251,146,60,0.5); border-radius:12px; height:100%; display:flex; flex-direction:column; justify-content:center;">
                <span style="font-size:13px; color:var(--brand-secondary); text-transform:uppercase; font-weight:700;">🏆 Best Logic Determined:</span>
                <b style="color:#fff; font-size:24px; font-family:'Outfit'; margin-top:5px;">${bestName}</b> 
                <span style="font-size:12px; color:#a0a0a0; margin-top:8px;">Comparing mapping topological data.</span>
            </div>
        `;
    }

    let predictionEl = document.getElementById('prediction');
    if (predictionEl) {
        predictionEl.innerHTML = `
            <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.05); padding:18px; border-radius:12px; height:100%; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:14px; color:#cbd5e1; display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span>Smart Suggested Distance:</span>
                    <b style="color:#10b981;">${best.toFixed(1)} km</b>
                </div>
                <div style="font-size:14px; color:#cbd5e1; display:flex; justify-content:space-between;">
                    <span>Optimal Aerial Line:</span>
                    <b style="color:#94a3b8;">${straight[sIdx][eIdx].toFixed(1)} km</b>
                </div>
            </div>
        `;
    }

    // DRAW SVGS EXACTLY IN REQUESTED ORDER
    drawSVGGraph('graphGreedy', greedyPath, names, straight);
    drawSVGGraph('graphTotal', normal, names, straight);
    drawSVGGraph('graphOptimal', optimalPath, names, straight);
    
    let finalPathLogic = best===d1 ? normal : best===d2 ? greedyPath : optimalPath;
    drawSVGGraph('graphFinal', finalPathLogic, names, straight);

    let dataToUse, colorToUse, iconToUse;
    if(best === d1) { dataToUse = r1.segmentsData; colorToUse = '#94a3b8'; iconToUse = 'ri-route-line'; }
    else if(best === d2) { dataToUse = r2.segmentsData; colorToUse = '#10b981'; iconToUse = 'ri-flight-takeoff-line'; }
    else { dataToUse = r3.segmentsData; colorToUse = '#fb923c'; iconToUse = 'ri-copper-diamond-line'; }

    renderBreakdown(dataToUse, names, best, bestName, colorToUse, iconToUse);
    renderJourneyRoadmap(dataToUse, names, best, bestName, colorToUse, finalPathLogic);

    // Show "Results" tab on mobile once analysis is ready
    const tabAnalysisBtn = document.getElementById('tabAnalysisBtn');
    if (tabAnalysisBtn) tabAnalysisBtn.style.display = '';

    // Show the map info badge briefly
    const mapInfoBadge = document.getElementById('mapInfoBadge');
    const mapInfoText = document.getElementById('mapInfoText');
    if (mapInfoBadge && mapInfoText) {
        mapInfoText.textContent = `✓ ${bestName} — ${best.toFixed(1)} km`;
        mapInfoBadge.style.display = 'flex';
        setTimeout(() => { mapInfoBadge.style.display = 'none'; }, 4000);
    }

    // Responsive layout handling after calculation
    const isMobile = window.innerWidth <= 820;
    if (!isMobile) {
        document.getElementById('analyticsHUD')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        // On mobile: switch to map tab so full route & villages are clearly framed in viewport!
        switchMobileTab('map');
        setTimeout(() => {
            triggerMapResize();
            if (coords && coords.length > 0) {
                const bounds = L.latLngBounds(coords);
                map.fitBounds(bounds, { padding: [25, 25], maxZoom: 13 });
            }
            // Show floating scroll pill so user can easily scroll down to analytics when ready
            const mobileMapScrollBtn = document.getElementById('mobileMapScrollBtn');
            if (mobileMapScrollBtn) {
                mobileMapScrollBtn.style.display = 'inline-flex';
            }
        }, 250);
    }
}
