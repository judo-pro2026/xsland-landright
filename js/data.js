let worldData = null;
let countries = {};
let singaporeData = null;

// 各「依州/邦別判定」國家的州界 GeoJSON 資料，key 跟 STATE_BASED_COUNTRIES 一致。
// 例如 stateGeoData.USA、stateGeoData.AUT
const stateGeoData = {};

// 外部地理資料來源：
// 1. 新加坡 GeoJSON：Singapore main-island polygon
// 2. 依州/邦別判定國家的州界 GeoJSON：見 config.js 的 STATE_BASED_COUNTRIES
const SPECIAL_GEOJSON_URLS = {
    singapore: "https://gist.githubusercontent.com/shinnc/efcc8b3bbac18551375225e3b2f8d0d8/raw/sg_main_island.geojson"
};

async function loadData() {
    try {
        const stateCountryCodes = Object.keys(STATE_BASED_COUNTRIES);

        // 統一組成一份「要抓的清單」，前三筆固定，後面依 STATE_BASED_COUNTRIES 動態展開。
        const fetchList = [
            ["data/world.geojson", "world.geojson"],
            ["data/processed/countries.json", "countries.json"],
            [SPECIAL_GEOJSON_URLS.singapore, "新加坡 GeoJSON"],
            ...stateCountryCodes.map(code => [
                STATE_BASED_COUNTRIES[code].geojsonUrl,
                `${STATE_BASED_COUNTRIES[code].countryZh}州/邦界 GeoJSON`
            ])
        ];

        const responses = await Promise.all(fetchList.map(([url]) => fetch(url)));

        responses.forEach((response, i) => {
            if (!response.ok) {
                throw new Error(`${fetchList[i][1]} 載入失敗：${response.status}`);
            }
        });

        const jsons = await Promise.all(responses.map(r => r.json()));

        worldData = jsons[0];
        countries = jsons[1];
        singaporeData = jsons[2];

        stateCountryCodes.forEach((code, i) => {
            stateGeoData[code] = jsons[3 + i];
        });

        console.log("World:", worldData);
        console.log("Countries:", countries);
        console.log("Singapore:", singaporeData);
        console.log("State-based countries:", stateGeoData);

        return true;
    } catch (error) {
        console.error("資料載入失敗：", error);
        return false;
    }
}
