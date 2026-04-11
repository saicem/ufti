// 维度类型
export interface Dimension {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// 选项类型
export interface Option {
  text: string;
  score: number;
}

// 题目类型
export interface Question {
  id: string;
  dimension: string;
  text: string;
  weight: number;
  options: Option[];
}

// 答案类型
export interface Answer {
  dimension: string;
  score: number;
  maxScore: number;
  weight: number;
}

// 维度分数类型
export interface DimensionScore {
  totalScore: number;
  maxScore: number;
  icon: string;
  name: string;
}

// 维度百分比类型
export interface DimensionPercentages {
  [key: string]: number;
}

// 盘格条件类型
export interface PersonalityCondition {
  min?: number;
  max?: number;
}

// 盘格类型
export interface Personality {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  conditions: Partial<Record<DimensionType, PersonalityCondition>>;
}

// 问题数据类型
export interface QuestionsData {
  dimensions: Dimension[];
  questions: Question[];
}

// 盘格数据类型
export interface PersonalitiesData {
  personalities: Personality[];
}

// 页面类型
export type PageType = 'home' | 'quiz' | 'loading' | 'result';


export type DimensionType = 'running' | 'breaking_mark' | 'catching' | 'throwing_mentality' | 'long_throw' | 'short_throw' | 'awareness'