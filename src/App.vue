<template>
  <div class="container">
    <!-- 首页 -->
    <section v-if="currentPage === 'home'" class="page">
      <div class="home-content">
        <div class="logo">
          <span class="logo-icon">🥏</span>
          <h1>UFTI</h1>
        </div>
        <p class="subtitle">Ultimate Frisbee Type Indicator</p>
        <p class="description">闲着也是闲着，来测测你的飞盘盘格吧！</p>
        <p class="note">⚠️ 重要声明：本评测仅供娱乐，非专业评测！
          信则灵，不信则更灵 😜</p>
        <div class="features">
          <div class="feature">
            <span class="feature-icon">🧐</span>
            <span>瞎评7大维度</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🎯</span>
            <span>乱点鸳鸯谱</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🤪</span>
            <span>快乐就完事</span>
          </div>
        </div>
        <button class="btn btn-primary" @click="startQuiz">开始评测</button>
      </div>
    </section>

    <!-- 题目页面 -->
    <section v-if="currentPage === 'quiz'" class="page">
      <div class="quiz-header">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressWidth }"></div>
        </div>
        <span class="progress-text">{{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
      </div>
      <div class="quiz-content">
        <div class="dimension-badge" v-if="currentQuestion">
          <span class="dimension-icon">{{ getDimensionIcon(currentQuestion.dimension) }}</span>
          <span class="dimension-name">{{ getDimensionName(currentQuestion.dimension) }}</span>
        </div>
        <h2 class="question-text">{{ currentQuestion?.text || '题目加载中...' }}</h2>
        <div class="options" v-if="currentQuestion">
          <button v-for="(option, index) in currentQuestion.options" :key="index" class="option"
            @click="selectOption(index)">
            {{ option.text }}
          </button>
        </div>
      </div>
    </section>

    <!-- 加载页面 -->
    <section v-if="currentPage === 'loading'" class="page">
      <div class="loading-content">
        <div class="flying-disc">
          <span class="disc-icon">🥏</span>
        </div>
        <p class="loading-text">正在分析你的盘格...</p>
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </section>

    <!-- 结果页面 -->
    <section v-if="currentPage === 'result'" class="page">
      <div class="result-content">
        <div class="result-header">
          <span class="result-icon">{{ matchedPersonality?.icon }}</span>
          <h2 class="result-name">{{ matchedPersonality?.name }}</h2>
          <p class="result-title">{{ matchedPersonality?.title }}</p>
        </div>
        <div class="result-description">{{ matchedPersonality?.description }}</div>
        <div class="dimensions-chart">
          <h3>维度得分</h3>
          <div class="chart-container">
            <div v-for="(dim, index) in dimensions" :key="dim.id" class="chart-item">
              <div class="chart-label">
                <span>{{ dim.icon }}</span>
                <span>{{ dim.name }}</span>
              </div>
              <div class="chart-bar-wrapper">
                <div class="chart-bar" :style="{
                  width: '0%',
                  background: chartColors[index % chartColors.length]
                }" ref="chartBars">
                  <span class="chart-value">{{ dimensionPercentages[dim.id] }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="result-note">
          <p>⚠️ 再次声明：本结果仅供娱乐，切勿当真！</p>
          <p>但如果你真的相信，那也挺好的 😊</p>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" @click="restart">再来一次</button>
          <button class="btn btn-secondary" @click="share">分享快乐</button>
        </div>
      </div>
    </section>

    <!-- 分享选项面板 -->
    <div v-if="showSharePanel" class="share-panel">
      <button v-for="option in shareOptions" :key="option.text" class="share-option"
        :class="{ close: option.text === '取消' }" @click="handleShareOption(option)">
        {{ option.text }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { dataService } from './services/dataService';
import type { PageType, Question, Dimension, Personality, DimensionPercentages } from './types/index';

// 状态管理
const currentPage = ref<PageType>('home');
const dimensions = ref<Dimension[]>([]);
const questions = ref<Question[]>([]);
const currentQuestionIndex = ref(0);
const answers = ref<Record<string, { dimension: string; score: number; weight: number }>>({});
const matchedPersonality = ref<Personality | null>(null);
const dimensionPercentages = ref<DimensionPercentages>({});
const showSharePanel = ref(false);
const shareOptions = ref<any[]>([]);
const chartBars = ref<HTMLElement[]>([]);

// 图表颜色
const chartColors = [
  '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
];

// 计算属性
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value];
});

const progressWidth = computed(() => {
  const progress = ((currentQuestionIndex.value + 1) / questions.value.length) * 100;
  return `${progress}%`;
});

// 方法
const getDimensionIcon = (dimensionId: string) => {
  const dimension = dimensions.value.find(d => d.id === dimensionId);
  return dimension?.icon || '🏃';
};

const getDimensionName = (dimensionId: string) => {
  const dimension = dimensions.value.find(d => d.id === dimensionId);
  return dimension?.name || '未知维度';
};

const startQuiz = () => {
  currentQuestionIndex.value = 0;
  answers.value = {};
  currentPage.value = 'quiz';
};

const selectOption = (optionIndex: number) => {
  if (!currentQuestion.value) return;

  const selectedOption = currentQuestion.value.options[optionIndex];
  if (!selectedOption) return;

  answers.value[currentQuestion.value.id] = {
    dimension: currentQuestion.value.dimension,
    score: selectedOption.score,
    weight: currentQuestion.value.weight
  };

  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
  } else {
    currentPage.value = 'loading';
    setTimeout(() => {
      calculateResult();
    }, 2000);
  }
};

const calculateResult = () => {
  const dimensionScores = dataService.calculateDimensionScores(answers.value);
  dimensionPercentages.value = dataService.calculatePercentages(dimensionScores);
  matchedPersonality.value = dataService.matchPersonality(dimensionPercentages.value);
  currentPage.value = 'result';

  // 触发图表动画
  nextTick(() => {
    animateCharts();
  });
};

const animateCharts = () => {
  chartBars.value.forEach((bar, index) => {
    if (bar) {
      setTimeout(() => {
        const dimension = dimensions.value[index];
        if (!dimension) return;
        const dimId = dimension.id;
        const percentage = dimensionPercentages.value[dimId];
        bar.style.width = `${percentage}%`;
      }, 100 + index * 100);
    }
  });
};

const restart = () => {
  currentPage.value = 'home';
};

const share = () => {
  if (!matchedPersonality.value) return;

  const name = matchedPersonality.value.name;
  const title = matchedPersonality.value.title;
  const text = `我在UFTI飞盘盘格评测中获得了【${name}】！${title}，快来测测你的盘格吧！`;

  shareOptions.value = [
    { text: '复制文字', action: () => copyText(text) }
  ];

  if (navigator.share) {
    shareOptions.value.push({
      text: '系统分享',
      action: () => {
        navigator.share({
          title: 'UFTI 飞盘盘格评测',
          text: text,
          url: window.location.href
        });
      }
    });
  }

  showSharePanel.value = true;
};

const copyText = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    alert('文字已复制到剪贴板！');
  }).catch(() => {
    alert('复制失败，请手动复制');
  });
  showSharePanel.value = false;
};

const handleShareOption = (option: any) => {
  if (option.action) {
    option.action();
  }
  showSharePanel.value = false;
};

// 生命周期
onMounted(async () => {
  try {
    const data = await dataService.init();
    dimensions.value = data.dimensions;
    questions.value = data.questions;
  } catch (error) {
    alert('加载数据失败，请刷新页面重试');
  }
});
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #FF6B35;
  --secondary-color: #4ECDC4;
  --accent-color: #FFE66D;
  --dark-color: #2C3E50;
  --light-color: #F7F9FC;
  --gradient-start: #667eea;
  --gradient-end: #764ba2;
  --shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  --radius: 16px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  min-height: 100vh;
  color: var(--dark-color);
  overflow-x: hidden;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.page {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 首页样式 */
.home-content {
  background: white;
  border-radius: var(--radius);
  padding: 50px 30px;
  text-align: center;
  box-shadow: var(--shadow);
}

.logo {
  margin-bottom: 10px;
}

.logo-icon {
  font-size: 80px;
  display: block;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-15px) rotate(5deg);
  }
}

.logo h1 {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-top: 10px;
}

.subtitle {
  font-size: 16px;
  color: #888;
  margin-bottom: 15px;
  letter-spacing: 2px;
}

.description {
  font-size: 18px;
  color: var(--dark-color);
  margin-bottom: 15px;
  line-height: 1.6;
}

.note {
  font-size: 14px;
  color: #666;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 30px;
  line-height: 1.5;
  font-style: italic;
}

.features {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.feature-icon {
  font-size: 32px;
}

.feature span:last-child {
  font-size: 14px;
  color: #666;
}

.btn {
  padding: 15px 50px;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), #f7931e);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
}

.btn-secondary {
  background: white;
  color: var(--dark-color);
  border: 2px solid #ddd;
}

.btn-secondary:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 题目页面样式 */
.quiz-header {
  background: white;
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow);
}

.progress-bar {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 4px;
  transition: width 0.3s ease;
  width: 0%;
}

.progress-text {
  font-size: 14px;
  color: #888;
  display: block;
  text-align: right;
}

.quiz-content {
  background: white;
  border-radius: var(--radius);
  padding: 40px 30px;
  box-shadow: var(--shadow);
}

.dimension-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #f5f7fa, #e4e8ec);
  padding: 10px 20px;
  border-radius: 50px;
  margin-bottom: 25px;
}

.dimension-icon {
  font-size: 24px;
}

.dimension-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--dark-color);
}

.question-text {
  font-size: 24px;
  font-weight: 700;
  color: var(--dark-color);
  margin-bottom: 30px;
  line-height: 1.4;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.option {
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 20px 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  font-size: 16px;
  line-height: 1.5;
  color: var(--dark-color);
}

.option:hover {
  background: white;
  border-color: var(--primary-color);
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option:active {
  transform: translateX(5px) scale(0.98);
}

/* 加载页面样式 */
.loading-content {
  background: white;
  border-radius: var(--radius);
  padding: 60px 40px;
  text-align: center;
  box-shadow: var(--shadow);
}

.flying-disc {
  margin-bottom: 30px;
}

.disc-icon {
  font-size: 100px;
  display: inline-block;
  animation: fly 2s ease-in-out infinite;
}

@keyframes fly {

  0%,
  100% {
    transform: translateX(-30px) rotate(-20deg);
  }

  50% {
    transform: translateX(30px) rotate(20deg);
  }
}

.loading-text {
  font-size: 20px;
  font-weight: 600;
  color: var(--dark-color);
  margin-bottom: 20px;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.loading-dots span {
  width: 12px;
  height: 12px;
  background: var(--primary-color);
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1);
  }
}

/* 结果页面样式 */
.result-content {
  background: white;
  border-radius: var(--radius);
  padding: 40px 30px;
  box-shadow: var(--shadow);
}

.result-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 2px dashed #eee;
}

.result-icon {
  font-size: 80px;
  display: block;
  margin-bottom: 15px;
  animation: bounceIn 0.8s ease;
}

@keyframes bounceIn {
  0% {
    transform: scale(0);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

.result-name {
  font-size: 36px;
  font-weight: 800;
  color: var(--dark-color);
  margin-bottom: 10px;
}

.result-title {
  font-size: 18px;
  color: #888;
}

.result-description {
  font-size: 16px;
  line-height: 1.8;
  color: #555;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid var(--primary-color);
}

.dimensions-chart {
  margin-bottom: 30px;
}

.dimensions-chart h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  color: var(--dark-color);
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.chart-label {
  width: 80px;
  font-size: 14px;
  font-weight: 600;
  color: var(--dark-color);
  display: flex;
  align-items: center;
  gap: 5px;
}

.chart-bar-wrapper {
  flex: 1;
  height: 24px;
  background: #eee;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.chart-bar {
  height: 100%;
  border-radius: 12px;
  transition: width 1s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
}

.chart-value {
  font-size: 12px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.result-note {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
  color: #6c757d;
}

.result-note p {
  margin: 5px 0;
}

.result-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

/* 分享选项面板 */
.share-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: var(--radius);
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  min-width: 300px;
  text-align: center;
}

.share-option {
  display: block;
  width: 100%;
  padding: 15px 20px;
  margin: 10px 0;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.share-option:not(.close) {
  background: linear-gradient(135deg, var(--primary-color), #f7931e);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
}

.share-option:not(.close):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
}

.share-option.close {
  background: #f8f9fa;
  color: var(--dark-color);
  border: 2px solid #e9ecef;
}

.share-option.close:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 600px) {
  .container {
    padding: 15px;
  }

  .home-content,
  .quiz-content,
  .loading-content,
  .result-content {
    padding: 30px 20px;
  }

  .logo h1 {
    font-size: 36px;
  }

  .logo-icon {
    font-size: 60px;
  }

  .features {
    gap: 20px;
  }

  .feature-icon {
    font-size: 24px;
  }

  .question-text {
    font-size: 20px;
  }

  .option {
    padding: 15px 20px;
    font-size: 15px;
  }

  .result-name {
    font-size: 28px;
  }

  .result-icon {
    font-size: 60px;
  }

  .chart-label {
    width: 70px;
    font-size: 12px;
  }

  .result-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
