const fs = require("fs");
const path = require("path");

// 專案根目錄
const ROOT = path.join(__dirname, "..");

// GeoJSON
const worldPath = path.join(ROOT, "data", "world.geojson");

// countries.json
const countriesPath = path.join(
    ROOT,
    "data",
    "processed",
    "countries.json"
);

const world = JSON.parse(
    fs.readFileSync(worldPath, "utf8")
);

// 如果 countries.json 已存在，就讀進來
let countries = {};

if (fs.existsSync(countriesPath)) {

    countries = JSON.parse(
        fs.readFileSync(countriesPath, "utf8")
    );

}

let added = 0;

for (const feature of world.features) {

    const code = feature.id;

    if (!code) continue;

    if (countries[code]) continue;

    countries[code] = {

        countryZh: "",

        countryEn: feature.properties.name,

        flag: "",

        status: "none",

        description: "",

        law: "",

        updated: "",

        allow: {

            residential: false,

            commercial: false,

            agricultural: false,

            forest: false

        }

    };

    added++;

}

fs.writeFileSync(
    countriesPath,
    JSON.stringify(countries, null, 2),
    "utf8"
);

console.log("==========");
console.log(`新增 ${added} 個國家`);
console.log(`目前共有 ${Object.keys(countries).length} 個國家`);
console.log("==========");