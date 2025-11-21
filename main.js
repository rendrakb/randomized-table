const names = ["A", "B", "C", "D"];
let tableData = [];
let questionTemplates = [];
let currentQuestion = null;
let currentAnswer = null;
let pageStartTime = Date.now();
let lastSubmitTime = null;
let correctCount = 0;
let totalAttempts = 0;

fetch("q.json")
  .then((res) => res.json())
  .then((data) => {
    questionTemplates = data;
    generateQuestion();
  })
  .catch((err) => {
    console.error("Error loading q.json:", err);
    alert("Could not load q.json.");
  });

function randomizeTableData() {
  tableData = names.map((name) => {
    const x1 = Math.floor(Math.random() * 101);
    const x2 = Math.floor(Math.random() * 101);
    return {
      name,
      1: Math.floor(Math.random() * 1000),
      x1,
      y1: 100 - x1,
      2: Math.floor(Math.random() * 1000),
      x2,
      y2: 100 - x2,
    };
  });
  renderTable(tableData);
}

function renderTable(data) {
  const headers = [
    "Name",
    "1",
    "X1<br>(%)",
    "Y1<br>(%)",
    "2",
    "X2<br>(%)",
    "Y2<br>(%)",
  ];
  let html = `<table><thead><tr>`;
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

function getValue(letter, column) {
  const row = tableData.find((r) => r.name === letter);
  return row ? row[column] : 0;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const columns = ["1", "x1", "y1", "2", "x2", "y2"];

function generateQuestion() {
  if (!questionTemplates.length || !tableData.length) return;

  const templateObj = pick(questionTemplates);
  const vars = {};

  const numbers = ["1", "2"];
  const percents = ["x1", "y1", "x2", "y2"];

  templateObj.variables.forEach((v) => {
    if (v.startsWith("letter")) vars[v] = pick(names);
    if (v === "number") vars[v] = pick(numbers);
    if (v === "percent") vars[v] = pick(percents);
  });

  if (vars.letterA === vars.letterB) {
    vars.letterB = names.find((c) => c !== vars.letterA);
  }

  switch (templateObj.type) {
    case "valueOfPercent":
      const percentValue = getValue(vars.letter, vars.percent);
      const baseColumn =
        vars.percent.startsWith("x") || vars.percent.startsWith("y")
          ? vars.percent.charAt(vars.percent.length - 1)
          : "1";
      const baseValue = getValue(vars.letter, baseColumn);
      currentAnswer = Math.round((percentValue / 100) * baseValue);
      break;
    case "highestPercentValue":
      const highestPercent = names.map((name) => {
        const pVal = getValue(name, vars.percent);
        const bCol =
          vars.percent.startsWith("x") || vars.percent.startsWith("y")
            ? vars.percent.charAt(vars.percent.length - 1)
            : "1";
        const bVal = getValue(name, bCol);
        return {
          name: name,
          value: Math.round((pVal / 100) * bVal),
        };
      });
      highestPercent.sort((a, b) => b.value - a.value);
      currentAnswer = highestPercent[0].name;
      break;
    case "lowestPercentValue":
      const lowestPercent = names.map((name) => {
        const pVal = getValue(name, vars.percent);
        const bCol =
          vars.percent.startsWith("x") || vars.percent.startsWith("y")
            ? vars.percent.charAt(vars.percent.length - 1)
            : "1";
        const bVal = getValue(name, bCol);
        return {
          name: name,
          value: Math.round((pVal / 100) * bVal),
        };
      });
      lowestPercent.sort((a, b) => a.value - b.value);
      currentAnswer = lowestPercent[0].name;
      break;
    case "averageOfNumber":
      const sumOfNumber = names.reduce(
        (sum, name) => sum + getValue(name, vars.number),
        0
      );
      currentAnswer = Math.round(sumOfNumber / names.length);
      break;
    case "highestTotalSum":
      const totalsHigh = names.map((name) => ({
        name: name,
        total: getValue(name, "1") + getValue(name, "2"),
      }));
      totalsHigh.sort((a, b) => b.total - a.total);
      currentAnswer = totalsHigh[0].name;
      break;
    case "lowestTotalSum":
      const totalsLow = names.map((name) => ({
        name: name,
        total: getValue(name, "1") + getValue(name, "2"),
      }));
      totalsLow.sort((a, b) => a.total - b.total);
      currentAnswer = totalsLow[0].name;
      break;
    case "averageOfLetter":
      const val1 = getValue(vars.letter, "1");
      const val2 = getValue(vars.letter, "2");
      currentAnswer = Math.round((val1 + val2) / 2);
      break;
    case "percentageContribution":
      const letterValue = getValue(vars.letter, vars.number);
      const totalOfColumn = names.reduce(
        (sum, name) => sum + getValue(name, vars.number),
        0
      );
      currentAnswer = totalOfColumn
        ? Math.round((letterValue / totalOfColumn) * 100) + "%"
        : "0%";
      break;
  }

  currentQuestion = templateObj.template;
  Object.entries(vars).forEach(([key, val]) => {
    currentQuestion = currentQuestion.replace(`{${key}}`, val);
  });

  document.querySelector(
    ".questions"
  ).innerHTML = `<strong>${currentQuestion}</strong><br><div id="answer" style="display:none;">Answer: ${currentAnswer}</div>`;

  document.getElementById("answerInput").value = "";
  document.getElementById("feedback").textContent = "";
  document.getElementById("feedback").style.color = "";
}

document.getElementById("questionButton").addEventListener("click", () => {
  generateQuestion();
});

document.getElementById("answerButton").addEventListener("click", () => {
  const answerDiv = document.getElementById("answer");
  if (answerDiv) {
    answerDiv.style.display = "block";
  }
});

document.getElementById("randomizeButton").addEventListener("click", () => {
  randomizeTableData();
  generateQuestion();
});

function normalizeAnswer(ans) {
  if (ans == null) return "";
  ans = String(ans).trim().toLowerCase();
  ans = ans.replace(/,/g, "");

  if (ans.endsWith("%")) {
    let num = parseFloat(ans.replace("%", ""));
    if (isNaN(num)) return ans;
    return Math.abs(num) + "%";
  }

  let num = parseFloat(ans);
  if (!isNaN(num)) return Math.abs(num);

  return ans;
}

document.getElementById("submitAnswerButton").addEventListener("click", () => {
  const userInput = document.getElementById("answerInput").value;
  const feedback = document.getElementById("feedback");

  const user = normalizeAnswer(userInput);
  const correct = normalizeAnswer(currentAnswer);

  totalAttempts++;
  let isCorrect = user === correct;
  if (isCorrect) correctCount++;

  document.getElementById(
    "score"
  ).textContent = `Score: ${correctCount}/${totalAttempts}`;

  const now = Date.now();
  if (lastSubmitTime) {
    const diffSec = (now - lastSubmitTime) / 1000;
    document.getElementById("last-time").textContent =
      "Last time spent: " + formatTime(diffSec);
  }
  lastSubmitTime = now;

  if (isCorrect) {
    feedback.textContent = "Correct.";
    feedback.style.color = "lightgreen";
  } else {
    feedback.textContent = "Wrong";
    feedback.style.color = "red";
  }
});

document.getElementById("answerInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("submitAnswerButton").click();
  }
});

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

setInterval(() => {
  const now = Date.now();
  const totalSec = (now - pageStartTime) / 1000;
  document.getElementById("total-time").textContent =
    "Total time spent: " + formatTime(totalSec);
}, 1000);

randomizeTableData();
