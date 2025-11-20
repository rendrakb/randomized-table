const names = ["A", "B", "C", "D"];

let tableData = [];

function randomizeTableData() {
  tableData = names.map(name => {
    const x1 = Math.floor(Math.random() * 101);
    const x2 = Math.floor(Math.random() * 101);
    return {
      name,
      "1": Math.floor(Math.random() * 1000),
      x1,
      y1: 100 - x1,
      "2": Math.floor(Math.random() * 1000),
      x2,
      y2: 100 - x2,
    };
  });

  renderTable(tableData);
  
}function renderTable(data) {
  const headers = ["Name", "1", "X1<br>(%)", "Y1<br>(%)", "2", "X2<br>(%)", "Y2<br>(%)"];
  let html = `<table border="1"><thead><tr>`;
  headers.forEach((h) => {
    html += `<th>${h}</th>`;
  });
  html += `</tr></thead><tbody>`;

  data.forEach((row) => {
    html += `<tr><td>${row.name}</td><td>${row["1"]}</td><td>${row.x1}</td><td>${row.y1}</td><td>${row["2"]}</td><td>${row.x2}</td><td>${row.y2}</td></tr>`;
  });

  html += `</tbody></table>`;
  document.getElementById("table").innerHTML = html;
}

document.addEventListener("DOMContentLoaded", () => {
  randomizeTableData(),   renderTable(tableData);
});
