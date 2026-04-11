const app = {
    questions: [],
    dimensions: [],
    personalities: [],
    currentQuestionIndex: 0,
    answers: {},
    dimensionScores: {},

    async init() {
        try {
            const [questionsRes, personalitiesRes] = await Promise.all([
                fetch('data/questions.json'),
                fetch('data/personalities.json')
            ]);

            const questionsData = await questionsRes.json();
            const personalitiesData = await personalitiesRes.json();

            this.questions = questionsData.questions;
            this.dimensions = questionsData.dimensions;
            this.personalities = personalitiesData.personalities;

            // 初始化维度分数存储
            this.dimensions.forEach(dim => {
                this.dimensionScores[dim.id] = {
                    totalScore: 0,
                    maxScore: 0,
                    icon: dim.icon,
                    name: dim.name
                };
            });
        } catch (error) {
            console.error('加载数据失败:', error);
            alert('加载数据失败，请刷新页面重试');
        }
    },

    startQuiz() {
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.dimensions.forEach(dim => {
            this.dimensionScores[dim.id] = {
                totalScore: 0,
                maxScore: 0,
                icon: dim.icon,
                name: dim.name
            };
        });

        this.showPage('quiz-page');
        this.renderQuestion();
    },

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
    },

    renderQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        const dimension = this.dimensions.find(d => d.id === question.dimension);

        // 更新进度条
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = `${this.currentQuestionIndex + 1} / ${this.questions.length}`;

        // 更新维度标签
        document.getElementById('dimension-icon').textContent = dimension.icon;
        document.getElementById('dimension-name').textContent = dimension.name;

        // 更新题目
        document.getElementById('question-text').textContent = question.text;

        // 渲染选项
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option';
            button.textContent = option.text;
            button.onclick = () => this.selectOption(index);
            optionsContainer.appendChild(button);
        });
    },

    selectOption(optionIndex) {
        const question = this.questions[this.currentQuestionIndex];
        const selectedOption = question.options[optionIndex];

        // 记录答案
        this.answers[question.id] = {
            dimension: question.dimension,
            score: selectedOption.score,
            maxScore: 10,
            weight: question.weight
        };

        // 累加维度分数
        const dimScore = this.dimensionScores[question.dimension];
        dimScore.totalScore += selectedOption.score * question.weight;
        dimScore.maxScore += 10 * question.weight;

        // 下一题或显示结果
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        } else {
            this.showLoading();
        }
    },

    showLoading() {
        this.showPage('loading-page');
        setTimeout(() => {
            this.calculateResult();
        }, 2000);
    },

    calculateResult() {
        // 计算各维度百分比
        const dimensionPercentages = {};
        for (const [dimId, scores] of Object.entries(this.dimensionScores)) {
            if (scores.maxScore > 0) {
                dimensionPercentages[dimId] = Math.round((scores.totalScore / scores.maxScore) * 100);
            } else {
                dimensionPercentages[dimId] = 0;
            }
        }

        // 匹配盘格
        const matchedPersonality = this.matchPersonality(dimensionPercentages);

        // 显示结果
        this.showResult(matchedPersonality, dimensionPercentages);
    },

    matchPersonality(dimensionPercentages) {
        for (const personality of this.personalities) {
            const conditions = personality.conditions;
            let matches = true;

            for (const [dimId, condition] of Object.entries(conditions)) {
                const score = dimensionPercentages[dimId] || 0;

                if (condition.min !== undefined && score < condition.min) {
                    matches = false;
                    break;
                }
                if (condition.max !== undefined && score > condition.max) {
                    matches = false;
                    break;
                }
            }

            if (matches) {
                return personality;
            }
        }

        // 默认返回萌新
        return this.personalities.find(p => p.id === 'newbie');
    },

    showResult(personality, dimensionPercentages) {
        document.getElementById('result-icon').textContent = personality.icon;
        document.getElementById('result-name').textContent = personality.name;
        document.getElementById('result-title').textContent = personality.title;
        document.getElementById('result-description').textContent = personality.description;

        // 渲染维度图表
        this.renderChart(dimensionPercentages, personality.color);

        this.showPage('result-page');
    },

    renderChart(dimensionPercentages, highlightColor) {
        const container = document.getElementById('chart-container');
        container.innerHTML = '';

        const colors = [
            '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
        ];

        this.dimensions.forEach((dim, index) => {
            const percentage = dimensionPercentages[dim.id] || 0;
            const color = colors[index % colors.length];

            const item = document.createElement('div');
            item.className = 'chart-item';

            item.innerHTML = `
                <div class="chart-label">
                    <span>${dim.icon}</span>
                    <span>${dim.name}</span>
                </div>
                <div class="chart-bar-wrapper">
                    <div class="chart-bar" style="width: 0%; background: ${color};">
                        <span class="chart-value">${percentage}%</span>
                    </div>
                </div>
            `;

            container.appendChild(item);

            // 动画效果
            setTimeout(() => {
                item.querySelector('.chart-bar').style.width = `${percentage}%`;
            }, 100 + index * 100);
        });
    },

    restart() {
        this.showPage('home-page');
    },

    share() {
        const name = document.getElementById('result-name').textContent;
        const title = document.getElementById('result-title').textContent;
        const text = `我在UFTI飞盘盘格评测中获得了【${name}】！${title}，快来测测你的盘格吧！`;

        if (navigator.share) {
            navigator.share({
                title: 'UFTI 飞盘盘格评测',
                text: text,
                url: window.location.href
            });
        } else {
            // 复制到剪贴板
            navigator.clipboard.writeText(text).then(() => {
                alert('结果已复制到剪贴板！');
            }).catch(() => {
                alert(text);
            });
        }
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
