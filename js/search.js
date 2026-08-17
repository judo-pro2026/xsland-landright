let searchIndex = [];
let selectedSearchIndex = -1;

function buildSearchIndex() {
    searchIndex = Object.entries(countries).map(([code, info]) => ({
        code,
        countryZh: info.countryZh || "",
        countryEn: info.countryEn || "",
        flag: info.flag || "🌍"
    }));

    // 將所有「依州/邦別判定」國家（見 config.js 的 STATE_BASED_COUNTRIES）
    // 底下的州/邦別加入搜尋索引，新增國家時這裡不用改。
    Object.entries(STATE_BASED_COUNTRIES).forEach(([countryCode, config]) => {
        const states = countries[countryCode]?.states;
        if (!states) return;

        Object.entries(states).forEach(([stateCode, info]) => {
            searchIndex.push({
                code: `${countryCode}-${stateCode}`,
                countryZh: `${config.countryZh} ${info.stateZh || ""}`.trim(),
                countryEn: `${config.countryEn} ${info.stateEn || ""}`.trim(),
                flag: config.flag || "🌍",
                isSubState: true,
                stateCode
            });
        });
    });
}

function searchCountries(keyword) {
    keyword = keyword.trim().toLowerCase();
    if (!keyword) return [];

    return searchIndex
        .map(country => {
            const zh = country.countryZh.toLowerCase();
            const en = country.countryEn.toLowerCase();
            const code = country.code.toLowerCase();
            let score = 0;

            if (code === keyword || en === keyword || zh === keyword) score = 100;
            else if (en.startsWith(keyword) || zh.startsWith(keyword)) score = 80;
            else if (code.startsWith(keyword)) score = 70;
            else if (en.includes(keyword) || zh.includes(keyword)) score = 50;
            else if (code.includes(keyword)) score = 40;

            return { ...country, score };
        })
        .filter(country => country.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
}

function renderSearchResults(results) {
    const resultBox = document.getElementById("searchResult");
    resultBox.innerHTML = "";

    if (!results.length) {
        resultBox.style.display = "none";
        return;
    }

    results.forEach((country, index) => {
        const item = document.createElement("div");
        item.className = "search-item";
        item.dataset.index = index;
        item.innerHTML = `
            <span class="search-flag">${country.flag}</span>
            <span class="search-name">
                <strong>${country.countryZh || country.countryEn}</strong>
                <small>${country.countryEn} · ${country.code}</small>
            </span>
        `;

        item.addEventListener("click", () => selectSearchResult(country));
        resultBox.appendChild(item);
    });

    resultBox.style.display = "block";
    selectedSearchIndex = -1;
}

function selectSearchResult(country) {
    const input = document.getElementById("countrySearch");
    const resultBox = document.getElementById("searchResult");

    jumpToCountry(country.code);

    input.value = `${country.flag} ${country.countryZh || country.countryEn}`;
    resultBox.style.display = "none";
}

function updateKeyboardSelection() {
    const items = document.querySelectorAll(".search-item");
    items.forEach(item => item.classList.remove("selected"));
    if (selectedSearchIndex >= 0 && items[selectedSearchIndex]) {
        items[selectedSearchIndex].classList.add("selected");
        items[selectedSearchIndex].scrollIntoView({ block: "nearest" });
    }
}

function initSearch() {
    const input = document.getElementById("countrySearch");
    buildSearchIndex();

    input.addEventListener("input", () => {
        renderSearchResults(searchCountries(input.value));
    });

    input.addEventListener("keydown", e => {
        const items = document.querySelectorAll(".search-item");
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!items.length) return;
            selectedSearchIndex = Math.min(selectedSearchIndex + 1, items.length - 1);
            updateKeyboardSelection();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!items.length) return;
            selectedSearchIndex = Math.max(selectedSearchIndex - 1, 0);
            updateKeyboardSelection();
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (!items.length || selectedSearchIndex < 0) return;
            items[selectedSearchIndex].click();
        } else if (e.key === "Escape") {
            document.getElementById("searchResult").style.display = "none";
        }
    });
}
