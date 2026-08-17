async function init() {
    createMap();

    const success = await loadData();
    if (!success) return;

    createGeoJson();
    createSingaporeLayer();
    createMicroStateHitAreas();
    createAllStatesLayers();
    initSearch();
}

init();
