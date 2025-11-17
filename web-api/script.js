// グローバル変数
let apiData = null;
let charts = {
  quantity: null,
  priceComparison: null,
  distribution: null,
};

// アクセストークンの表示/非表示切り替え
function toggleTokenVisibility() {
  const tokenInput = document.getElementById("apiToken");
  tokenInput.type = tokenInput.type === "password" ? "text" : "password";
}

// エラーメッセージの表示
function showError(message) {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
  document.getElementById("loadingMessage").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
}

// ローディング表示
function showLoading() {
  document.getElementById("loadingMessage").style.display = "block";
  document.getElementById("errorMessage").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
}

// ダッシュボード表示
function showDashboard() {
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("loadingMessage").style.display = "none";
  document.getElementById("errorMessage").style.display = "none";
}

// APIからデータ取得
async function fetchData() {
  const apiToken = document.getElementById("apiToken").value;
  const yearMonth = document.getElementById("yearMonth").value;

  // バリデーション
  if (!apiToken) {
    showError("アクセストークンを入力してください。");
    return;
  }

  if (!yearMonth) {
    showError("集計月を選択してください。");
    return;
  }

  showLoading();

  const baseUrl = "https://api.expolis.cloud/opendata/t/kure/v1";
  const url = `${baseUrl}/generic-drug?year_month=${yearMonth}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "ecp-api-token": apiToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `HTTPエラー: ${response.status} - ${response.statusText}`
      );
    }

    apiData = await response.json();

    // データが正しい形式か確認
    if (!apiData || !apiData.医薬品リスト) {
      throw new Error("データの形式が正しくありません。");
    }

    // データを処理して表示
    processAndDisplayData(apiData);
    showDashboard();
  } catch (error) {
    console.error("API呼び出しエラー:", error);
    showError(`データの取得に失敗しました: ${error.message}`);
  }
}

// データ処理と表示
function processAndDisplayData(data) {
  // サマリー統計の計算
  const stats = calculateStatistics(data);

  // サマリーカードの更新
  updateSummaryCards(stats);

  // グラフの描画
  drawCharts(data, stats);

  // テーブルの更新
  updateTable(data);
}

// 統計情報の計算
function calculateStatistics(data) {
  // 拡張された統計情報を計算して返す
  let genericDrugCount = 0;
  let totalQuantity = 0;
  let totalPriceDiff = 0;
  let priceDiffCount = 0;
  let totalEstimatedSavings = 0; // 先発を使った場合との差分合計
  let totalOriginalQuantity = 0; // APIに先発数量がある場合に使用

  data.医薬品リスト.forEach((item) => {
    const originalPrice = parseFloat(item.先発品医薬品.薬価);
    // もし先発品の数量が含まれていれば取る（スキーマにない場合は0）
    const originalQuantity = parseFloat(item.先発品医薬品.数量) || 0;
    totalOriginalQuantity += originalQuantity;

    item.後発品医薬品.forEach((generic) => {
      genericDrugCount++;
      const quantity = parseFloat(generic.数量) || 0;
      totalQuantity += quantity;

      const genericPrice = parseFloat(generic.薬価);
      if (!isNaN(originalPrice) && !isNaN(genericPrice)) {
        totalPriceDiff += originalPrice - genericPrice;
        priceDiffCount++;
        // 単位当たりの削減額を掛け合わせて合計削減額を算出
        totalEstimatedSavings += (originalPrice - genericPrice) * quantity;
      }
    });
  });

  const totalUsed = totalOriginalQuantity + totalQuantity;
  const genericUsageRate = totalUsed > 0 ? (totalQuantity / totalUsed) * 100 : null;

  return {
    originalDrugCount: data.医薬品リスト.length,
    genericDrugCount: genericDrugCount,
    totalQuantity: totalQuantity,
    averagePriceDiff: priceDiffCount > 0 ? (totalPriceDiff / priceDiffCount).toFixed(2) : 0,
    totalEstimatedSavings: Math.round(totalEstimatedSavings),
    genericUsageRate: genericUsageRate,
  };
}

// サマリーカードの更新
function updateSummaryCards(stats) {
  document.getElementById("originalDrugCount").textContent =
    stats.originalDrugCount.toLocaleString();
  document.getElementById("genericDrugCount").textContent =
    stats.genericDrugCount.toLocaleString();
  document.getElementById("totalQuantity").textContent =
    stats.totalQuantity.toLocaleString();
  document.getElementById("averagePriceDiff").textContent = parseFloat(
    stats.averagePriceDiff
  ).toLocaleString();

  document.getElementById("totalEstimatedSavings").textContent =
    "¥" + (stats.totalEstimatedSavings || 0).toLocaleString();

  document.getElementById("genericUsageRate").textContent =
    stats.genericUsageRate === null ? "-" : stats.genericUsageRate.toFixed(1);
}

// グラフの描画
function drawCharts(data, stats) {
  drawQuantityChart(data);
  drawPriceComparisonChart(data);
  drawDistributionChart(data);
}

// 数量トップ10グラフ
function drawQuantityChart(data) {
  const genericDrugs = [];

  data.医薬品リスト.forEach((item) => {
    item.後発品医薬品.forEach((generic) => {
      genericDrugs.push({
        name: generic.医薬品名,
        quantity: parseFloat(generic.数量) || 0,
      });
    });
  });

  // 数量でソート
  genericDrugs.sort((a, b) => b.quantity - a.quantity);
  const top10 = genericDrugs.slice(0, 10);

  const ctx = document.getElementById("quantityChart");

  // 既存のグラフを破棄
  if (charts.quantity) {
    charts.quantity.destroy();
  }

  charts.quantity = new Chart(ctx, {
    type: "bar",
    data: {
      labels: top10.map((d) => d.name),
      datasets: [
        {
          label: "数量",
          data: top10.map((d) => d.quantity),
          backgroundColor: "rgba(102, 126, 234, 0.8)",
          borderColor: "rgba(102, 126, 234, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value.toLocaleString();
            },
          },
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
    },
  });
}

// 先発品と後発品の薬価比較グラフ
function drawPriceComparisonChart(data) {
  const comparisonData = [];

  data.医薬品リスト.slice(0, 5).forEach((item) => {
    const originalPrice = parseFloat(item.先発品医薬品.薬価);
    const avgGenericPrice =
      item.後発品医薬品.reduce((sum, generic) => {
        return sum + parseFloat(generic.薬価);
      }, 0) / item.後発品医薬品.length;

    comparisonData.push({
      name: item.先発品医薬品.医薬品名,
      original: originalPrice,
      generic: avgGenericPrice,
    });
  });

  const ctx = document.getElementById("priceComparisonChart");

  if (charts.priceComparison) {
    charts.priceComparison.destroy();
  }

  charts.priceComparison = new Chart(ctx, {
    type: "bar",
    data: {
      labels: comparisonData.map((d) => d.name),
      datasets: [
        {
          label: "先発品薬価",
          data: comparisonData.map((d) => d.original),
          backgroundColor: "rgba(244, 67, 54, 0.8)",
          borderColor: "rgba(244, 67, 54, 1)",
          borderWidth: 1,
        },
        {
          label: "後発品平均薬価",
          data: comparisonData.map((d) => d.generic),
          backgroundColor: "rgba(76, 175, 80, 0.8)",
          borderColor: "rgba(76, 175, 80, 1)",
          borderWidth: 1,
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
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "¥" + value.toLocaleString();
            },
          },
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
    },
  });
}

// 後発品医薬品別数量分布グラフ
function drawDistributionChart(data) {
  const distributionData = {};

  data.医薬品リスト.forEach((item) => {
    item.後発品医薬品.forEach((generic) => {
      const name = generic.医薬品名;
      const quantity = parseFloat(generic.数量) || 0;

      if (distributionData[name]) {
        distributionData[name] += quantity;
      } else {
        distributionData[name] = quantity;
      }
    });
  });

  // データを配列に変換してソート
  const sortedData = Object.entries(distributionData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const ctx = document.getElementById("distributionChart");

  if (charts.distribution) {
    charts.distribution.destroy();
  }

  charts.distribution = new Chart(ctx, {
    type: "line",
    data: {
      labels: sortedData.map((d) => d[0]),
      datasets: [
        {
          label: "数量",
          data: sortedData.map((d) => d[1]),
          backgroundColor: "rgba(102, 126, 234, 0.2)",
          borderColor: "rgba(102, 126, 234, 1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
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
          ticks: {
            callback: function (value) {
              return value.toLocaleString();
            },
          },
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
    },
  });
}

// テーブルの更新
function updateTable(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  // 表示モードに応じてテーブルの行を絞り込む
  const displayMode = document.getElementById("displayMode").value;
  const topN = parseInt(document.getElementById("topN").value, 10) || 10;

  // 集計：先発品ごとの後発品合計数量・平均薬価・合計削減額
  const perDrug = data.医薬品リスト.map((item) => {
    const originalDrug = item.先発品医薬品;
    const originalPrice = parseFloat(originalDrug.薬価);
    let totalQty = 0;
    let totalCost = 0;
    const generics = item.後発品医薬品.map((g) => {
      const qty = parseFloat(g.数量) || 0;
      const price = parseFloat(g.薬価) || 0;
      totalQty += qty;
      totalCost += price * qty;
      return {
        name: g.医薬品名,
        price: price,
        quantity: qty,
        unit: g.単位,
        unitSaving: isNaN(originalPrice) ? 0 : originalPrice - price,
        totalSaving: isNaN(originalPrice) ? 0 : (originalPrice - price) * qty,
      };
    });

    const avgGenericPrice = totalQty > 0 ? totalCost / totalQty : 0;

    return {
      originalName: originalDrug.医薬品名,
      originalPrice: parseFloat(originalDrug.薬価),
      generics,
      totalQty,
      avgGenericPrice,
      totalSaving: isNaN(parseFloat(originalDrug.薬価)) ? 0 : (parseFloat(originalDrug.薬価) - avgGenericPrice) * totalQty,
    };
  });

  // フラット化して表示候補をつくる
  let rows = [];
  perDrug.forEach((d) => {
    if (displayMode === "cheapest") {
      // 最安の後発品1つだけ
      const cheapest = d.generics.slice().sort((a, b) => a.price - b.price)[0];
      if (cheapest && cheapest.quantity > 0) {
        rows.push({
          originalName: d.originalName,
          originalPrice: d.originalPrice,
          genericName: cheapest.name,
          genericPrice: cheapest.price,
          quantity: cheapest.quantity,
          unit: cheapest.unit,
          unitSaving: cheapest.unitSaving,
        });
      }
    } else if (displayMode === "topn") {
      // トップNの後発品
      const sorted = d.generics.slice().sort((a, b) => b.quantity - a.quantity).slice(0, topN);
      sorted.forEach((g) => {
        if (g.quantity > 0) {
          rows.push({
            originalName: d.originalName,
            originalPrice: d.originalPrice,
            genericName: g.name,
            genericPrice: g.price,
            quantity: g.quantity,
            unit: g.unit,
            unitSaving: g.unitSaving,
          });
        }
      });
    } else {
      // 全て表示
      d.generics.forEach((g) => {
        if (g.quantity > 0) {
          rows.push({
            originalName: d.originalName,
            originalPrice: d.originalPrice,
            genericName: g.name,
            genericPrice: g.price,
            quantity: g.quantity,
            unit: g.unit,
            unitSaving: g.unitSaving,
          });
        }
      });
    }
  });

  // テーブルに書き出し
  rows.forEach((r) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = r.originalName;
    row.insertCell(1).textContent = isNaN(r.originalPrice) ? "-" : "¥" + r.originalPrice.toFixed(2);
    row.insertCell(2).textContent = r.genericName;
    row.insertCell(3).textContent = "¥" + r.genericPrice.toFixed(2);
    row.insertCell(4).textContent = r.quantity.toLocaleString();
    row.insertCell(5).textContent = r.unit;
    const diffCell = row.insertCell(6);
    diffCell.textContent = "¥" + (r.unitSaving || 0).toFixed(2);
    diffCell.className = (r.unitSaving || 0) > 0 ? "price-diff-positive" : "price-diff-negative";
  });
}

// CSVエクスポート
function exportCSV() {
  const table = document.getElementById("dataTable");
  const rows = Array.from(table.querySelectorAll("tr"));
  const csv = rows.map((r) => {
    const cols = Array.from(r.querySelectorAll("th,td")).map((c) => {
      // カンマや改行をエスケープ
      const txt = c.textContent.replace(/\n/g, " ").replace(/"/g, '""');
      return `"${txt}"`;
    });
    return cols.join(",");
  }).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ym = document.getElementById("yearMonth").value || "data";
  a.download = `generic_drug_${ym}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ページ読み込み時の初期化
document.addEventListener("DOMContentLoaded", function () {
  // Enterキーでデータ取得
  document
    .getElementById("apiToken")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        fetchData();
      }
    });

  document
    .getElementById("yearMonth")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        fetchData();
      }
    });
});
