let map;
let geojson;
let singaporeLayer;
let singaporeHitLayer;
let activeSpecialLayer = null;

const countryLayers = {};

// 所有「依州/邦別判定」國家的州別互動圖層與資料，統一格式管理：
// stateLayers："<國碼>-<州碼>" -> Leaflet layer（例如 "USA-CA"、"AUT-W"）
// stateCountryLayers："<國碼>" -> 該國州別的 L.geoJSON 總圖層
const stateLayers = {};
const stateCountryLayers = {};

function createMap() {
    map = L.map("map").setView([20, 0], 2);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map);
}

function getStatusConfig(status) {
    return STATUS_CONFIG[status] || STATUS_CONFIG.none;
}

function getCountryStatus(code) {
    const info = countries[code];
    return getStatusConfig(info?.status);
}

function isStateBasedCountry(code) {
    return Object.prototype.hasOwnProperty.call(STATE_BASED_COUNTRIES, code);
}

function getCountryStyle(feature) {
    const code = feature.id;
    const status = getCountryStatus(code);

    // 依州/邦別判定的國家（見 config.js 的 STATE_BASED_COUNTRIES）：
    // 這裡的整塊國界只負責當底色，不參與點擊/hover，互動完全交給州/邦圖層。
    if (isStateBasedCountry(code)) {
        return {
            color: "#555",
            weight: 1,
            fillColor: status.color,
            fillOpacity: 0.6,
            interactive: false
        };
    }

    return {
        color: "#555",
        weight: 1,
        fillColor: status.color,
        fillOpacity: 0.6
    };
}

function highlightFeature(e) {
    const layer = e.target;
    layer.setStyle({ weight: 3, color: "#222", fillOpacity: 0.9 });
    layer.bringToFront();
}

function resetHighlight(e) {
    if (e.target === singaporeLayer || (singaporeLayer && singaporeLayer.hasLayer(e.target))) {
        singaporeLayer.setStyle(getSingaporeStyle());
        return;
    }

    for (const code of Object.keys(stateCountryLayers)) {
        const layer = stateCountryLayers[code];
        if (layer && layer.hasLayer(e.target)) {
            e.target.setStyle(getStateStyle(code)(e.target.feature));
            return;
        }
    }

    if (geojson) {
        geojson.resetStyle(e.target);
    }
}

function getCountryLabel(feature) {
    const info = countries[feature.id];
    if (!info) return feature.properties?.name || feature.id;
    return `${info.flag || "🌍"} ${info.countryZh || info.countryEn}`;
}

function selectCountry(e) {
    const layer = e.target;
    updateSidebar(layer.feature);
}

function onEachFeature(feature, layer) {
    const code = feature.id;

    // ==========================================
    // 🇹🇼 臺灣 = 本國
    // 不加入一般國家互動系統
    // ==========================================
    if (code === HOME_COUNTRY) {
        layer.setStyle({
            color: "#777",
            weight: 1,
            fillColor: "#D9D9D9",
            fillOpacity: 0.25,
            interactive: false
        });

        // 不加入 countryLayers
        // 不建立 Tooltip
        // 不建立 click
        return;
    }

    // ==========================================
    // 依州/邦別判定的國家（美國、奧地利……見 config.js）
    // 整塊國界只保留參照（showCountryStates() 需要用來調整透明度），
    // 不加 Tooltip、不加 click/hover，避免攔截州/邦圖層的點擊。
    // ==========================================
    if (isStateBasedCountry(code)) {
        countryLayers[code] = layer;
        return;
    }

    // ==========================================
    // 一般外國
    // ==========================================
    countryLayers[code] = layer;

    layer.bindTooltip(getCountryLabel(feature), {
        sticky: true,
        direction: "top"
    });

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: selectCountry
    });
}

function createGeoJson() {
    geojson = L.geoJSON(worldData, {
        style: getCountryStyle,
        onEachFeature
    }).addTo(map);

    if (geojson.getLayers().length > 0) {
        map.fitBounds(geojson.getBounds());
    }
}

function getSingaporeStyle() {
    const info = countries.SGP;
    const status = getStatusConfig(info?.status);
    return {
        color: "#555",
        weight: 2,
        fillColor: status.color,
        fillOpacity: 0.8
    };
}

function createSingaporeHitArea() {
    // 新加坡在世界尺度下非常小，直接點 Polygon 幾乎無法操作。
    // 因此增加一個「透明點擊熱區」：不改變地圖外觀，只負責接收滑鼠/觸控。
    if (!singaporeData || singaporeHitLayer) return;

    const bounds = L.geoJSON(singaporeData).getBounds();
    const center = bounds.getCenter();

    singaporeHitLayer = L.marker(center, {
        interactive: true,
        keyboard: true,
        zIndexOffset: 1000,
        icon: L.divIcon({
            className: "singapore-hit-area",
            html: "",
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        })
    }).addTo(map);

    singaporeHitLayer.bindTooltip("🇸🇬 新加坡 Singapore", {
        direction: "top",
        offset: [0, -12]
    });

    singaporeHitLayer.on("click", () => {
        jumpToCountry("SGP");
    });

    singaporeHitLayer.on("mouseover", () => {
        if (singaporeLayer) singaporeLayer.setStyle({ weight: 4, color: "#111", fillOpacity: 0.95 });
    });

    singaporeHitLayer.on("mouseout", () => {
        if (singaporeLayer) singaporeLayer.setStyle(getSingaporeStyle());
    });
}

function createSingaporeLayer() {
    if (!singaporeData) return;

    singaporeLayer = L.geoJSON(singaporeData, {
        style: getSingaporeStyle,
        onEachFeature(feature, layer) {
            feature.id = "SGP";
            layer.feature = feature;
            layer.bindTooltip("🇸🇬 新加坡 Singapore", { sticky: true, direction: "top" });
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: selectCountry
            });
        }
    }).addTo(map);

    // 確保新加坡圖層位於世界國界之上。
    singaporeLayer.bringToFront();
    countryLayers.SGP = singaporeLayer;

    createSingaporeHitArea();
}

// ==========================================
// 通用：面積極小、容易被鄰國圖層蓋住而點不到的國家（見 config.js 的 MICRO_STATES）
// 做法比照新加坡：疊加一個透明的可點擊「熱區」標記在最上層，
// 不改變地圖上原本的顏色/外觀，只負責接收滑鼠/觸控事件。
// ==========================================

const microStateHitLayers = {};

function createMicroStateHitAreas() {
    if (typeof MICRO_STATES === "undefined") return;

    MICRO_STATES.forEach(code => {
        const layer = countryLayers[code];
        if (!layer) {
            console.warn(`找不到微型國家圖層，略過熱區建立：${code}`);
            return;
        }

        const center = layer.getBounds().getCenter();

        const hitLayer = L.marker(center, {
            interactive: true,
            keyboard: true,
            zIndexOffset: 1000,
            icon: L.divIcon({
                className: "micro-state-hit-area",
                html: "",
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(map);

        hitLayer.bindTooltip(getCountryLabel(layer.feature), {
            direction: "top",
            offset: [0, -10]
        });

        hitLayer.on("click", () => {
            jumpToCountry(code);
        });

        hitLayer.on("mouseover", () => {
            layer.setStyle({ weight: 3, color: "#222", fillOpacity: 0.9 });
            layer.bringToFront();
        });

        hitLayer.on("mouseout", () => {
            geojson.resetStyle(layer);
        });

        microStateHitLayers[code] = hitLayer;
    });
}

// ==========================================
// 通用：依州/邦別判定的國家（美國、奧地利……）
// 新增國家時不需要動這裡，只要在 config.js 的
// STATE_BASED_COUNTRIES 裡加一筆設定，
// 並在 countries.json 對應國家底下補上 "states": {...} 即可。
// ==========================================

function resolveStateCode(countryCode, properties, feature) {
    const config = STATE_BASED_COUNTRIES[countryCode];
    return properties?.abbreviation
        || properties?.STUSPS
        || properties?.abbr
        || (config && config.nameToCode[properties?.name])
        || feature?.id;
}

function getStateInfo(countryCode, stateCode) {
    return countries[countryCode]?.states?.[stateCode] || null;
}

function getStateStyle(countryCode) {
    return function (feature) {
        const code = resolveStateCode(countryCode, feature.properties, feature);
        const info = getStateInfo(countryCode, code);
        const status = getStatusConfig(info?.status);

        return {
            color: "#555",
            weight: 1,
            fillColor: status.color,
            fillOpacity: 0.7
        };
    };
}

function createStatesLayer(countryCode) {
    const geoData = stateGeoData[countryCode];
    if (!geoData) return;

    const layer = L.geoJSON(geoData, {
        style: getStateStyle(countryCode),
        onEachFeature(feature, lyr) {
            const code = resolveStateCode(countryCode, feature.properties, feature);
            const info = getStateInfo(countryCode, code);
            const key = `${countryCode}-${code}`;

            const stateFeature = {
                ...feature,
                id: key,
                properties: {
                    ...(feature.properties || {}),
                    stateCode: code,
                    stateZh: info?.stateZh || feature.properties?.name || "",
                    stateEn: info?.stateEn || feature.properties?.name || "",
                    countryCode
                }
            };

            lyr.feature = stateFeature;
            stateLayers[key] = lyr;

            lyr.bindTooltip(
                `${info?.statusZh || ""} · ${info?.stateZh || feature.properties?.name || code}`,
                { sticky: true, direction: "top" }
            );

            lyr.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: () => updateStateSidebar(countryCode, stateFeature, info)
            });
        }
    }).addTo(map);

    // 首頁就顯示該國州/邦別；搜尋該國時再自動放大。
    layer.setStyle(getStateStyle(countryCode));
    stateCountryLayers[countryCode] = layer;
}

function createAllStatesLayers() {
    Object.keys(STATE_BASED_COUNTRIES).forEach(createStatesLayer);
}

function showCountryStates(countryCode) {
    const layer = stateCountryLayers[countryCode];
    if (!layer) return null;

    if (!map.hasLayer(layer)) {
        layer.addTo(map);
    }

    layer.setStyle(getStateStyle(countryCode));
    activeSpecialLayer = countryCode;

    // 避免原本的整個國界與州/邦界重疊。
    const baseLayer = countryLayers[countryCode];
    if (baseLayer) {
        baseLayer.setStyle({ fillOpacity: 0.05, weight: 1, color: "#888" });
    }

    return layer;
}

function hideCountryStates(countryCode) {
    const layer = stateCountryLayers[countryCode];
    if (!layer) return;
    // 不隱藏州/邦界：首頁即可看到分色。
    layer.setStyle(getStateStyle(countryCode));
}

function hideAllCountryStates() {
    Object.keys(stateCountryLayers).forEach(hideCountryStates);
}

function updateStateSidebar(countryCode, feature, info) {
    const flag = document.getElementById("countryFlag");
    const name = document.getElementById("countryName");
    const english = document.getElementById("countryEn");
    const status = document.getElementById("countryStatus");
    const description = document.getElementById("countryDescription");
    const updated = document.getElementById("countryUpdated");

    const statusConfig = getStatusConfig(info?.status);
    const config = STATE_BASED_COUNTRIES[countryCode] || {};

    flag.textContent = config.flag || "🌍";
    name.textContent = info?.stateZh || feature.properties?.stateZh || feature.properties?.name || "";
    english.textContent = info?.stateEn || feature.properties?.stateEn || feature.properties?.name || "";
    status.textContent = info?.statusZh || statusConfig.text;
    status.style.backgroundColor = info?.color || statusConfig.color;
    status.style.color = "#fff";
    description.textContent = info?.description || "目前沒有詳細說明。";
    updated.textContent = info?.updated || "—";
}

function jumpToCountry(code) {
    // 新加坡：獨立 GeoJSON
    if (code === "SGP") {
        if (!singaporeLayer) {
            console.warn("找不到新加坡圖層");
            return;
        }

        singaporeLayer.addTo(map);
        activeSpecialLayer = "SGP";
        map.flyToBounds(singaporeLayer.getBounds(), { padding: [50, 50], duration: 1.2, maxZoom: 8 });
        singaporeLayer.setStyle({ weight: 4, color: "#111", fillOpacity: 0.95 });
        updateSidebar({ id: "SGP", properties: { name: "Singapore" } });
        return;
    }

    // 依州/邦別判定的國家本身（例如 "USA"、"AUT"）：改以州/邦圖層定位
    if (isStateBasedCountry(code)) {
        const layer = showCountryStates(code);
        if (!layer) {
            console.warn(`找不到 ${code} 的州/邦界圖層`);
            return;
        }

        map.flyToBounds(layer.getBounds(), { padding: [30, 30], duration: 1.2, maxZoom: 5 });
        updateSidebar({ id: code, properties: { name: STATE_BASED_COUNTRIES[code]?.countryEn || code } });
        return;
    }

    // 某個州/邦（格式："USA-CA"、"AUT-W"）
    const dashIndex = code.indexOf("-");
    if (dashIndex > 0) {
        const countryCode = code.slice(0, dashIndex);
        const stateCode = code.slice(dashIndex + 1);

        if (isStateBasedCountry(countryCode)) {
            const layer = stateLayers[code];
            if (!layer) {
                console.warn(`找不到州/邦圖層：${code}`);
                return;
            }

            showCountryStates(countryCode);
            map.flyToBounds(layer.getBounds(), { padding: [50, 50], duration: 1.2, maxZoom: 7 });
            layer.setStyle({ weight: 4, color: "#111", fillOpacity: 0.95 });
            updateStateSidebar(countryCode, layer.feature, getStateInfo(countryCode, stateCode));
            return;
        }
    }

    const layer = countryLayers[code];
    if (!layer) {
        console.warn(`找不到國家圖層：${code}`);
        return;
    }

    hideAllCountryStates();
    activeSpecialLayer = null;

    map.flyToBounds(layer.getBounds(), {
        padding: [50, 50],
        duration: 1.2,
        maxZoom: 7
    });

    layer.setStyle({ weight: 4, color: "#111", fillOpacity: 0.9 });
    updateSidebar(layer.feature);
}
