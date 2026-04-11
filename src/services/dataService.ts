import type { Dimension, Question, Personality, DimensionPercentages, DimensionScore, PersonalityCondition } from '@/types/index';
import questionsData from '@/data/questions.json';
import personalitiesData from '@/data/personalities.json';

class DataService {
  private dimensions: Dimension[] = [];
  private questions: Question[] = [];
  private personalities: Personality[] = [];

  async init() {
    try {
      this.dimensions = questionsData.dimensions;
      this.questions = questionsData.questions;
      this.personalities = personalitiesData.personalities;

      return {
        dimensions: this.dimensions,
        questions: this.questions,
        personalities: this.personalities
      };
    } catch (error) {
      console.error('加载数据失败:', error);
      throw error;
    }
  }

  getDimensions() {
    return this.dimensions;
  }

  getQuestions() {
    return this.questions;
  }

  getPersonalities() {
    return this.personalities;
  }

  calculateDimensionScores(answers: Record<string, { dimension: string; score: number; weight: number }>) {
    const dimensionScores: Record<string, DimensionScore> = {};

    // 初始化维度分数
    this.dimensions.forEach(dim => {
      dimensionScores[dim.id] = {
        totalScore: 0,
        maxScore: 0,
        icon: dim.icon,
        name: dim.name
      };
    });

    // 计算分数
    this.questions.forEach(question => {
      const answer = answers[question.id];
      if (answer) {
        const dimScore = dimensionScores[question.dimension];
        if (dimScore) {
          dimScore.totalScore += answer.score * question.weight;
          dimScore.maxScore += 10 * question.weight;
        }
      }
    });

    return dimensionScores;
  }

  calculatePercentages(dimensionScores: Record<string, DimensionScore>): DimensionPercentages {
    const percentages: DimensionPercentages = {};
    
    for (const [dimId, scores] of Object.entries(dimensionScores)) {
      if (scores.maxScore > 0) {
        percentages[dimId] = Math.round((scores.totalScore / scores.maxScore) * 100);
      } else {
        percentages[dimId] = 0;
      }
    }

    return percentages;
  }

  matchPersonality(percentages: DimensionPercentages): Personality {
    for (const personality of this.personalities) {
      const conditions = personality.conditions;
      let matches = true;

      for (const [dimId, condition] of Object.entries(conditions)) {
        const score = percentages[dimId] || 0;

        if (condition) {
          const typedCondition = condition as PersonalityCondition;
          if (typedCondition.min !== undefined && score < typedCondition.min) {
            matches = false;
            break;
          }
          if (typedCondition.max !== undefined && score > typedCondition.max) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        return personality;
      }
    }

    // 默认返回萌新
    const newbie = this.personalities.find(p => p.id === 'newbie');
    if (newbie) return newbie;
    const first = this.personalities[0];
    if (first) return first;
    throw new Error('No personalities found');
  }
}

export const dataService = new DataService();
