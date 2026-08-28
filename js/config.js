// 本國設定
const HOME_COUNTRY = "TWN";

const STATUS_CONFIG = {
    equal: {
        text: "完全平等互惠國家 Equal and reciprocal countries",
        color: "#43A050"
    },

    conditional: {
        text: "附條件平等互惠國家 Conditional equal and reciprocal country",
        color: "#F2B84B"
    },

    partial: {
        text: "部分互惠",
        color: "#FBC02D"
    },

    restricted: {
        text: "有條件平等互惠國家",
        color: "#FB8C00"
    },

    none: {
        text: "無平等互惠國家 Non-equal and reciprocal countries",
        color: "#D32F2F"
    },

    unknown: {
        text: "尚待查證",
        color: "#9E9E9E"
    }
};

// ==========================================
// 世界尺度下面積極小、容易被鄰國圖層蓋住而點不到的國家。
// 這些國家（或「國碼-州碼」格式的迷你州/特區，例如 USA-DC）會額外疊加一個
// 透明的「點擊熱區」（做法比照新加坡），不影響原本地圖上的顏色顯示，
// 只負責讓滑鼠/觸控更容易點到。新增項目時只要把代碼加進這個陣列即可，
// 不需要改其他程式。
// ==========================================
const MICRO_STATES = ["AND", "MCO", "SMR", "USA-DC"];

// ==========================================
// 依「州/邦別」判定的國家設定
// 這裡的 key 必須跟 countries.json 裡的國家代碼一致（例如 USA、AUT）。
// 新增一個這樣的國家時，只要在這裡加一筆設定，
// 並在 countries.json 裡對應的國家底下建立 "states": {...}，
// 其餘 data.js / map.js / search.js 的邏輯都會自動套用，不需要再改程式。
// ==========================================
const STATE_BASED_COUNTRIES = {
    USA: {
        flag: "🇺🇸",
        countryZh: "美國",
        countryEn: "United States",
        // 美國 50 州 + DC 界線 GeoJSON
        // 原本的 wboykinm 版本沿用自 D3 範例資料，先天沒有收錄華盛頓特區(DC)這塊形狀，
        // 換成 PublicaMundi/MappingAPI 這份有包含 DC 的版本（結構相同，皆用 properties.name）。
        geojsonUrl: "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json",
        // GeoJSON 的 properties.name（英文全名）→ countries.json 裡 states 的 key
        nameToCode: {
            Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY"
        }
    },

    AUT: {
        flag: "🇦🇹",
        countryZh: "奧地利",
        countryEn: "Austria",
        // 奧地利 9 邦界線 GeoJSON（ginseng666/GeoJSON-TopoJSON-Austria，CC BY 4.0 Flooh Perlot）
        geojsonUrl: "https://raw.githubusercontent.com/ginseng666/GeoJSON-TopoJSON-Austria/master/2017/simplified-95/laender_95_geo.json",
        // GeoJSON 的 properties.name（德文邦名）→ countries.json 裡 states 的 key
        nameToCode: {
            "Burgenland": "B",
            "Kärnten": "K",
            "Niederösterreich": "N",
            "Oberösterreich": "O",
            "Salzburg": "S",
            "Steiermark": "ST",
            "Tirol": "T",
            "Vorarlberg": "V",
            "Wien": "W"
        }
    }
};
