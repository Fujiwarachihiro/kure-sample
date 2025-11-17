// グローバル変数
let rawData = [];
let filteredData = [];
let currentPage = 1;
let itemsPerPage = 25;
let charts = {};

// CSVファイルの読み込み
document.getElementById("csvFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    parseCSV(text);
  };
  reader.readAsText(file, "UTF-8");

  document.getElementById("uploadStatus").innerHTML =
    '<span style="color: #48bb78;">読み込み中...</span>';
});

// CSVパース関数
function parseCSV(text) {
  const lines = text.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",");

  rawData = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length >= 7) {
      rawData.push({
        yearMonth: values[0].trim(),
        originalDrugName: values[1].trim(),
        originalDrugPrice: parseFloat(values[2]) || 0,
        genericDrugName: values[3].trim(),
        genericDrugPrice: parseFloat(values[4]) || 0,
        quantity: parseFloat(values[5]) || 0,
        unit: values[6].trim(),
        priceDiff: (parseFloat(values[2]) || 0) - (parseFloat(values[4]) || 0),
      });
    }
  }

  filteredData = [...rawData];

  if (rawData.length > 0) {
    document.getElementById(
      "uploadStatus"
    ).innerHTML = `<span style="color: #48bb78;">✓ ${rawData.length}件のデータを読み込みました</span>`;
    updateDashboard();
  } else {
    document.getElementById("uploadStatus").innerHTML =
      '<span style="color: #f56565;">データの読み込みに失敗しました</span>';
  }
}

// ダッシュボード更新
function updateDashboard() {
  // セクション表示
  document.getElementById("summarySection").classList.remove("hidden");
  document.getElementById("chartsSection").classList.remove("hidden");
  document.getElementById("distributionSection").classList.remove("hidden");
  document.getElementById("tableSection").classList.remove("hidden");

  // サマリーカード更新
  updateSummaryCards();

  // チャート更新
  updateCharts();

  // テーブル更新
  updateTable();
}

// サマリーカード更新
function updateSummaryCards() {
  // 先発品種類数
  const originalDrugs = new Set(rawData.map((d) => d.originalDrugName));
  document.getElementById("originalCount").textContent = originalDrugs.size;

  // 後発品種類数
  const genericDrugs = new Set(rawData.map((d) => d.genericDrugName));
  document.getElementById("genericCount").textContent = genericDrugs.size;

  // 総数量
  const totalQuantity = rawData.reduce((sum, d) => sum + d.quantity, 0);
  document.getElementById("totalQuantity").textContent =
    totalQuantity.toLocaleString();

  // 平均薬価差
  const avgPriceDiff =
    rawData.reduce((sum, d) => sum + d.priceDiff, 0) / rawData.length;
  document.getElementById(
    "avgPriceDiff"
  ).textContent = `¥${avgPriceDiff.toFixed(2)}`;
}

// チャート更新
function updateCharts() {
  updateTop10Chart();
  updatePriceComparisonChart();
  updateQuantityDistributionChart();
}

// 後発品医薬品 使用数量トップ10
function updateTop10Chart() {
  const quantityByGeneric = {};
  rawData.forEach((d) => {
    if (!quantityByGeneric[d.genericDrugName]) {
      quantityByGeneric[d.genericDrugName] = 0;
    }
    quantityByGeneric[d.genericDrugName] += d.quantity;
  });

  const sorted = Object.entries(quantityByGeneric)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = sorted.map((d) => d[0]);
  const data = sorted.map((d) => d[1]);

  if (charts.top10) charts.top10.destroy();

  const ctx = document.getElementById("top10Chart").getContext("2d");
  charts.top10 = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "使用数量",
          data: data,
          backgroundColor: "rgba(102, 126, 234, 0.8)",
          borderColor: "rgba(102, 126, 234, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// 先発品と後発品の薬価比較
function updatePriceComparisonChart() {
  // 薬価が高い順にソートして上位10件を取得
  const sortedByPrice = [...rawData]
    .sort((a, b) => b.originalDrugPrice - a.originalDrugPrice)
    .slice(0, 10);

  const labels = sortedByPrice.map((d) => d.originalDrugName.substring(0, 20));
  const originalPrices = sortedByPrice.map((d) => d.originalDrugPrice);
  const genericPrices = sortedByPrice.map((d) => d.genericDrugPrice);

  if (charts.priceComparison) charts.priceComparison.destroy();

  const ctx = document.getElementById("priceComparisonChart").getContext("2d");
  charts.priceComparison = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "先発品薬価",
          data: originalPrices,
          backgroundColor: "rgba(246, 173, 85, 0.8)",
          borderColor: "rgba(246, 173, 85, 1)",
          borderWidth: 1,
        },
        {
          label: "後発品薬価",
          data: genericPrices,
          backgroundColor: "rgba(102, 126, 234, 0.8)",
          borderColor: "rgba(102, 126, 234, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// 後発品医薬品別 数量分布（折れ線グラフ、15項目）
function updateQuantityDistributionChart() {
  // 後発品ごとに数量を集計
  const quantityByGeneric = {};
  rawData.forEach((d) => {
    if (!quantityByGeneric[d.genericDrugName]) {
      quantityByGeneric[d.genericDrugName] = 0;
    }
    quantityByGeneric[d.genericDrugName] += d.quantity;
  });

  // 数量が多い順にソートして上位15件を取得
  const sorted = Object.entries(quantityByGeneric)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const labels = sorted.map((d) => d[0]);
  const data = sorted.map((d) => d[1]);

  if (charts.quantityDistribution) charts.quantityDistribution.destroy();

  const ctx = document
    .getElementById("quantityDistributionChart")
    .getContext("2d");
  charts.quantityDistribution = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "数量",
          data: data,
          borderColor: "rgba(102, 126, 234, 1)",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "rgba(102, 126, 234, 1)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value.toLocaleString();
            },
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    },
  });
}

// テーブル更新
function updateTable() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = filteredData.slice(start, end);

  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  pageData.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${row.yearMonth}</td>
            <td>${row.originalDrugName}</td>
            <td>¥${row.originalDrugPrice.toFixed(2)}</td>
            <td>${row.genericDrugName}</td>
            <td>¥${row.genericDrugPrice.toFixed(2)}</td>
            <td>${row.quantity.toLocaleString()}</td>
            <td>${row.unit}</td>
            <td>¥${row.priceDiff.toFixed(2)}</td>
        `;
    tbody.appendChild(tr);
  });

  updatePagination();
}

// ページネーション更新
function updatePagination() {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  document.getElementById(
    "pageInfo"
  ).textContent = `${currentPage} / ${totalPages}`;
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
}

// 検索機能
document.getElementById("searchInput").addEventListener("input", function (e) {
  const searchTerm = e.target.value.toLowerCase();
  filteredData = rawData.filter((row) => {
    return Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
  });
  currentPage = 1;
  updateTable();
});

// ページあたりの表示件数変更
document
  .getElementById("itemsPerPage")
  .addEventListener("change", function (e) {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    updateTable();
  });

// ページネーションボタン
document.getElementById("prevPage").addEventListener("click", function () {
  if (currentPage > 1) {
    currentPage--;
    updateTable();
  }
});

document.getElementById("nextPage").addEventListener("click", function () {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    updateTable();
  }
});
