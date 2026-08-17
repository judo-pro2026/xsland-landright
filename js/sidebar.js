function updateSidebar(feature) {

    const code = feature.id;

    const info = countries[code];

    const flag =
        document.getElementById("countryFlag");

    const name =
        document.getElementById("countryName");

    const english =
        document.getElementById("countryEn");

    const status =
        document.getElementById("countryStatus");

    const description =
        document.getElementById("countryDescription");

    const updated =
        document.getElementById("countryUpdated");


    if (!info) {

        flag.textContent = "🌍";

        name.textContent =
            feature.properties.name || code;

        english.textContent = code;

        status.textContent = "尚未建檔";

        description.textContent =
            "目前沒有這個國家的互惠資料。";

        updated.textContent = "—";

        return;

    }


    const statusConfig =
        STATUS_CONFIG[info.status]
        || STATUS_CONFIG.unknown
        || STATUS_CONFIG.none;


    flag.textContent =
        info.flag || "🌍";

    name.textContent =
        info.countryZh ||
        info.countryEn ||
        feature.properties.name;

    english.textContent =
        info.countryEn ||
        feature.properties.name;

    status.textContent =
        statusConfig.text;

    status.style.backgroundColor =
        statusConfig.color;

    status.style.color = "#fff";

    description.textContent =
        info.description ||
        "目前沒有詳細說明。";

    updated.textContent =
        info.updated || "—";

}