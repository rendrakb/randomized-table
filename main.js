const CONFIG = {
  TABLE: {
    NAMES: ["A", "B", "C", "D"],
    NUMBER_COLUMNS: ["1", "2"],
    PERCENT_COLUMNS: ["x1", "y1", "x2", "y2"],
    MAX_VALUE: 1000,
    MAX_PERCENT: 100,
  },
  HEADERS: [
    "Name",
    "1",
    "X1<br>(%)",
    "Y1<br>(%)",
    "2",
    "X2<br>(%)",
    "Y2<br>(%)",
  ],
  COLORS: {
    CORRECT: "lightgreen",
    INCORRECT: "red",
  },
};

const state = {
  tableData: [],
  questionTemplates: [],
  currentQuestion: null,
  currentAnswer: null,
  pageStartTime: Date.now(),
  lastSubmitTime: null,
  correctCount: 0,
  totalAttempts: 0,
  currentQuestionSubmitted: false,
};

class TableDataManager {
  constructor() {
    this.data = [];
  }

  randomize() {
    this.data = CONFIG.TABLE.NAMES.map((name) => {
      const x1 = Math.floor(Math.random() * (CONFIG.TABLE.MAX_PERCENT + 1));
      const x2 = Math.floor(Math.random() * (CONFIG.TABLE.MAX_PERCENT + 1));

      return {
        name,
        1: Math.floor(Math.random() * CONFIG.TABLE.MAX_VALUE),
        x1,
        y1: CONFIG.TABLE.MAX_PERCENT - x1,
        2: Math.floor(Math.random() * CONFIG.TABLE.MAX_VALUE),
        x2,
        y2: CONFIG.TABLE.MAX_PERCENT - x2,
      };
    });

    return this.data;
  }

  getValue(letter, column) {
    const row = this.data.find((r) => r.name === letter);
    return row ? row[column] : 0;
  }

  getData() {
    return this.data;
  }

  getAllNames() {
    return CONFIG.TABLE.NAMES;
  }
}

class TableRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(data) {
    const table = this.buildTable(data);
    this.container.innerHTML = table;
  }

  buildTable(data) {
    const headerRow = this.buildHeaderRow();
    const bodyRows = this.buildBodyRows(data);

    return `
      <table>
        <thead>
          ${headerRow}
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    `;
  }

  buildHeaderRow() {
    const headers = CONFIG.HEADERS.map((h) => `<th>${h}</th>`).join("");
    return `<tr>${headers}</tr>`;
  }

  buildBodyRows(data) {
    return data
      .map((row) => {
        const cells = `
          <td>${row.name}</td>
          <td>${row["1"]}</td>
          <td>${row.x1}</td>
          <td>${row.y1}</td>
          <td>${row["2"]}</td>
          <td>${row.x2}</td>
          <td>${row.y2}</td>
        `;
        return `<tr>${cells}</tr>`;
      })
      .join("");
  }
}

class QuestionGenerator {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  static pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  generateVariables(variableNames) {
    const vars = {};

    variableNames.forEach((varName) => {
      if (varName.startsWith("letter")) {
        vars[varName] = QuestionGenerator.pickRandom(CONFIG.TABLE.NAMES);
      }
      if (varName === "number") {
        vars[varName] = QuestionGenerator.pickRandom(
          CONFIG.TABLE.NUMBER_COLUMNS
        );
      }
      if (varName === "percent") {
        vars[varName] = QuestionGenerator.pickRandom(
          CONFIG.TABLE.PERCENT_COLUMNS
        );
      }
    });

    if (vars.letterA && vars.letterB && vars.letterA === vars.letterB) {
      vars.letterB = CONFIG.TABLE.NAMES.find((c) => c !== vars.letterA);
    }

    return vars;
  }

  calculateAnswer(type, vars) {
    switch (type) {
      case "valueOfPercent":
        return this.calculateValueOfPercent(vars);

      case "highestPercentValue":
        return this.findHighestPercentValue(vars);

      case "lowestPercentValue":
        return this.findLowestPercentValue(vars);

      case "averageOfNumber":
        return this.calculateAverageOfNumber(vars);

      case "highestTotalSum":
        return this.findHighestTotalSum();

      case "lowestTotalSum":
        return this.findLowestTotalSum();

      case "averageOfLetter":
        return this.calculateAverageOfLetter(vars);

      case "percentageContribution":
        return this.calculatePercentageContribution(vars);

      default:
        console.warn(`Unknown question type: ${type}`);
        return null;
    }
  }

  calculateValueOfPercent(vars) {
    const percentValue = this.dataManager.getValue(vars.letter, vars.percent);
    const baseColumn = this.getBaseColumnForPercent(vars.percent);
    const baseValue = this.dataManager.getValue(vars.letter, baseColumn);
    return Math.round((percentValue / 100) * baseValue);
  }

  getBaseColumnForPercent(percentColumn) {
    if (percentColumn.startsWith("x") || percentColumn.startsWith("y")) {
      return percentColumn.charAt(percentColumn.length - 1);
    }
    return "1";
  }

  findHighestPercentValue(vars) {
    const values = this.calculatePercentValuesForAll(vars.percent);
    values.sort((a, b) => b.value - a.value);
    return values[0].name;
  }

  findLowestPercentValue(vars) {
    const values = this.calculatePercentValuesForAll(vars.percent);
    values.sort((a, b) => a.value - b.value);
    return values[0].name;
  }

  calculatePercentValuesForAll(percentColumn) {
    return CONFIG.TABLE.NAMES.map((name) => {
      const percentValue = this.dataManager.getValue(name, percentColumn);
      const baseColumn = this.getBaseColumnForPercent(percentColumn);
      const baseValue = this.dataManager.getValue(name, baseColumn);
      return {
        name,
        value: Math.round((percentValue / 100) * baseValue),
      };
    });
  }

  calculateAverageOfNumber(vars) {
    const sum = CONFIG.TABLE.NAMES.reduce(
      (total, name) => total + this.dataManager.getValue(name, vars.number),
      0
    );
    return Math.round(sum / CONFIG.TABLE.NAMES.length);
  }

  findHighestTotalSum() {
    const totals = this.calculateTotalSums();
    totals.sort((a, b) => b.total - a.total);
    return totals[0].name;
  }

  findLowestTotalSum() {
    const totals = this.calculateTotalSums();
    totals.sort((a, b) => a.total - b.total);
    return totals[0].name;
  }

  calculateTotalSums() {
    return CONFIG.TABLE.NAMES.map((name) => ({
      name,
      total:
        this.dataManager.getValue(name, "1") +
        this.dataManager.getValue(name, "2"),
    }));
  }

  calculateAverageOfLetter(vars) {
    const val1 = this.dataManager.getValue(vars.letter, "1");
    const val2 = this.dataManager.getValue(vars.letter, "2");
    return Math.round((val1 + val2) / 2);
  }

  calculatePercentageContribution(vars) {
    const letterValue = this.dataManager.getValue(vars.letter, vars.number);
    const totalOfColumn = CONFIG.TABLE.NAMES.reduce(
      (sum, name) => sum + this.dataManager.getValue(name, vars.number),
      0
    );

    if (totalOfColumn === 0) return "0%";

    const percentage = Math.round((letterValue / totalOfColumn) * 100);
    return `${percentage}%`;
  }

  generate() {
    if (!state.questionTemplates.length || !this.dataManager.getData().length) {
      console.warn("Cannot generate question: missing templates or data");
      return null;
    }

    const template = QuestionGenerator.pickRandom(state.questionTemplates);
    const variables = this.generateVariables(template.variables);
    const answer = this.calculateAnswer(template.type, variables);

    let questionText = template.template;
    Object.entries(variables).forEach(([key, value]) => {
      questionText = questionText.replace(`{${key}}`, value);
    });

    state.currentQuestion = questionText;
    state.currentAnswer = answer;

    return { question: questionText, answer };
  }
}

class UIController {
  constructor() {
    this.elements = {
      questionDisplay: document.querySelector(".questions"),
      answerInput: document.getElementById("answerInput"),
      feedback: document.getElementById("feedback"),
      answerDiv: null,
      score: document.getElementById("score"),
      lastTime: document.getElementById("last-time"),
      totalTime: document.getElementById("total-time"),
    };
  }

  displayQuestion(question, answer) {
    this.elements.questionDisplay.innerHTML = `
      <strong>${question}</strong><br>
      <div id="answer" style="display:none;">Answer: ${answer}</div>
    `;
    this.clearInput();
    this.clearFeedback();
    this.updateAnswerElement();
  }

  updateAnswerElement() {
    this.elements.answerDiv = document.getElementById("answer");
  }

  clearInput() {
    this.elements.answerInput.value = "";
  }

  clearFeedback() {
    this.elements.feedback.textContent = "";
    this.elements.feedback.style.color = "";
  }

  showAnswer() {
    if (this.elements.answerDiv) {
      this.elements.answerDiv.style.display = "block";
    }
  }

  showFeedback(isCorrect) {
    this.elements.feedback.textContent = isCorrect ? "Correct." : "Wrong";
    this.elements.feedback.style.color = isCorrect
      ? CONFIG.COLORS.CORRECT
      : CONFIG.COLORS.INCORRECT;
  }

  updateScore() {
    this.elements.score.textContent = `Score: ${state.correctCount}/${state.totalAttempts}`;
  }

  updateLastTime(seconds) {
    this.elements.lastTime.textContent = `Last time spent: ${this.formatTime(
      seconds
    )}`;
  }

  updateTotalTime() {
    const totalSeconds = (Date.now() - state.pageStartTime) / 1000;
    this.elements.totalTime.textContent = `Total time spent: ${this.formatTime(
      totalSeconds
    )}`;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }

  getUserAnswer() {
    return this.elements.answerInput.value;
  }
}

class AnswerValidator {
  static normalize(answer, expectedHasPercent = false) {
    if (answer == null) return "";

    let normalized = String(answer).trim().toLowerCase();
    normalized = normalized.replace(/,/g, "");

    const num = parseFloat(normalized.replace("%", ""));
    if (!isNaN(num)) {
      if (expectedHasPercent) {
        return `${Math.abs(num)}%`;
      } else {
        return Math.abs(num);
      }
    }

    return normalized;
  }

  static isCorrect(userAnswer, correctAnswer) {
    const normalizedUser = this.normalize(userAnswer);
    const normalizedCorrect = this.normalize(correctAnswer);
    return normalizedUser === normalizedCorrect;
  }
}

class QuizApp {
  constructor() {
    this.dataManager = new TableDataManager();
    this.tableRenderer = new TableRenderer("table");
    this.questionGenerator = new QuestionGenerator(this.dataManager);
    this.uiController = new UIController();
    this.initialize();
  }

  async initialize() {
    await this.loadQuestionTemplates();
    this.setupEventListeners();
    this.startTimers();
    this.initializeTableAndQuestion();
  }

  async loadQuestionTemplates() {
    try {
      const response = await fetch("q.json");
      state.questionTemplates = await response.json();
    } catch (error) {
      console.error("Error loading q.json:", error);
      alert("Could not load q.json.");
    }
  }

  setupEventListeners() {
    document
      .getElementById("questionButton")
      .addEventListener("click", () => this.generateNewQuestion());

    document
      .getElementById("answerButton")
      .addEventListener("click", () => this.uiController.showAnswer());

    document
      .getElementById("randomizeButton")
      .addEventListener("click", () => this.handleRandomize());

    document
      .getElementById("submitAnswerButton")
      .addEventListener("click", () => this.handleSubmit());

    this.uiController.elements.answerInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleSubmit();
    });
  }

  startTimers() {
    setInterval(() => this.uiController.updateTotalTime(), 1000);
  }

  initializeTableAndQuestion() {
    this.randomizeTable();
    this.generateNewQuestion();
  }

  randomizeTable() {
    const data = this.dataManager.randomize();
    state.tableData = data;
    this.tableRenderer.render(data);
  }

  generateNewQuestion() {
    const result = this.questionGenerator.generate();
    if (result) {
      this.uiController.displayQuestion(result.question, result.answer);

      state.currentQuestionSubmitted = false;
    }
  }

  handleRandomize() {
    this.randomizeTable();
    this.generateNewQuestion();
  }

  handleSubmit() {
    if (state.currentQuestionSubmitted) return;

    const userAnswer = this.uiController.getUserAnswer();
    const isCorrect = AnswerValidator.isCorrect(
      userAnswer,
      state.currentAnswer
    );

    state.totalAttempts++;
    if (isCorrect) state.correctCount++;

    this.uiController.updateScore();
    this.uiController.showFeedback(isCorrect);

    const now = Date.now();
    if (state.lastSubmitTime) {
      const elapsedSeconds = (now - state.lastSubmitTime) / 1000;
      this.uiController.updateLastTime(elapsedSeconds);
    }
    state.lastSubmitTime = now;

    state.currentQuestionSubmitted = true;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new QuizApp());
} else {
  new QuizApp();
}
