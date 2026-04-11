import json
from typing import Dict, List, Any

class UFTITester:
    def __init__(self):
        with open('data/questions.json', 'r', encoding='utf-8') as f:
            questions_data = json.load(f)
            self.dimensions = questions_data['dimensions']
            self.questions = questions_data['questions']
        
        with open('data/personalities.json', 'r', encoding='utf-8') as f:
            personalities_data = json.load(f)
            self.personalities = personalities_data['personalities']
    
    def calculate_dimension_scores(self, answers: Dict[str, int]) -> Dict[str, int]:
        """计算维度分数"""
        dimension_scores = {dim['id']: {'total': 0, 'max': 0} for dim in self.dimensions}
        
        for question in self.questions:
            qid = question['id']
            if qid in answers:
                dim_id = question['dimension']
                weight = question['weight']
                selected_score = answers[qid]
                max_score = 10  # 每个选项最高10分
                
                dimension_scores[dim_id]['total'] += selected_score * weight
                dimension_scores[dim_id]['max'] += max_score * weight
        
        # 计算百分比
        percentages = {}
        for dim_id, scores in dimension_scores.items():
            if scores['max'] > 0:
                percentages[dim_id] = round((scores['total'] / scores['max']) * 100)
            else:
                percentages[dim_id] = 0
        
        return percentages
    
    def match_personality(self, dimension_percentages: Dict[str, int]) -> List[Dict]:
        """匹配盘格，返回所有匹配的盘格"""
        matched = []
        
        for personality in self.personalities:
            conditions = personality['conditions']
            matches = True
            
            for dim_id, condition in conditions.items():
                score = dimension_percentages.get(dim_id, 0)
                
                if 'min' in condition and score < condition['min']:
                    matches = False
                    break
                if 'max' in condition and score > condition['max']:
                    matches = False
                    break
            
            if matches:
                matched.append(personality)
        
        return matched
    
    def test_all_max_scores(self):
        """测试所有题目选最高分的情况"""
        print("=" * 60)
        print("测试场景1: 所有题目选择最高分")
        print("=" * 60)
        
        answers = {}
        for question in self.questions:
            max_option_score = max(opt['score'] for opt in question['options'])
            answers[question['id']] = max_option_score
        
        percentages = self.calculate_dimension_scores(answers)
        matched = self.match_personality(percentages)
        
        print("\n维度得分:")
        for dim_id, score in percentages.items():
            dim_name = next(d['name'] for d in self.dimensions if d['id'] == dim_id)
            print(f"  {dim_name}: {score}%")
        
        print(f"\n匹配到的盘格 ({len(matched)}个):")
        for p in matched:
            print(f"  - {p['name']} ({p['id']})")
        
        if len(matched) > 1:
            print("\n⚠️ 警告: 多个盘格同时匹配！")
        
        return matched
    
    def test_all_min_scores(self):
        """测试所有题目选最低分的情况"""
        print("\n" + "=" * 60)
        print("测试场景2: 所有题目选择最低分")
        print("=" * 60)
        
        answers = {}
        for question in self.questions:
            min_option_score = min(opt['score'] for opt in question['options'])
            answers[question['id']] = min_option_score
        
        percentages = self.calculate_dimension_scores(answers)
        matched = self.match_personality(percentages)
        
        print("\n维度得分:")
        for dim_id, score in percentages.items():
            dim_name = next(d['name'] for d in self.dimensions if d['id'] == dim_id)
            print(f"  {dim_name}: {score}%")
        
        print(f"\n匹配到的盘格 ({len(matched)}个):")
        for p in matched:
            print(f"  - {p['name']} ({p['id']})")
        
        if len(matched) > 1:
            print("\n⚠️ 警告: 多个盘格同时匹配！")
        
        return matched
    
    def test_middle_scores(self):
        """测试所有题目选中间分的情况"""
        print("\n" + "=" * 60)
        print("测试场景3: 所有题目选择中间分")
        print("=" * 60)
        
        answers = {}
        for question in self.questions:
            scores = sorted([opt['score'] for opt in question['options']])
            middle_score = scores[len(scores) // 2]
            answers[question['id']] = middle_score
        
        percentages = self.calculate_dimension_scores(answers)
        matched = self.match_personality(percentages)
        
        print("\n维度得分:")
        for dim_id, score in percentages.items():
            dim_name = next(d['name'] for d in self.dimensions if d['id'] == dim_id)
            print(f"  {dim_name}: {score}%")
        
        print(f"\n匹配到的盘格 ({len(matched)}个):")
        for p in matched:
            print(f"  - {p['name']} ({p['id']})")
        
        if len(matched) > 1:
            print("\n⚠️ 警告: 多个盘格同时匹配！")
        
        return matched
    
    def test_specific_personality(self, target_id: str):
        """测试特定盘格的匹配条件"""
        print("\n" + "=" * 60)
        print(f"测试场景: 验证盘格 '{target_id}' 的匹配条件")
        print("=" * 60)
        
        personality = next((p for p in self.personalities if p['id'] == target_id), None)
        if not personality:
            print(f"错误: 找不到盘格 '{target_id}'")
            return
        
        print(f"\n盘格: {personality['name']}")
        print(f"匹配条件:")
        for dim_id, condition in personality['conditions'].items():
            dim_name = next(d['name'] for d in self.dimensions if d['id'] == dim_id)
            if 'min' in condition and 'max' in condition:
                print(f"  {dim_name}: {condition['min']}% - {condition['max']}%")
            elif 'min' in condition:
                print(f"  {dim_name}: >= {condition['min']}%")
            elif 'max' in condition:
                print(f"  {dim_name}: <= {condition['max']}%")
        
        # 生成满足条件的测试数据
        answers = {}
        for question in self.questions:
            dim_id = question['dimension']
            if dim_id in personality['conditions']:
                condition = personality['conditions'][dim_id]
                target_score = 0
                
                if 'min' in condition and 'max' in condition:
                    target_score = (condition['min'] + condition['max']) // 2
                elif 'min' in condition:
                    target_score = condition['min'] + 10
                elif 'max' in condition:
                    target_score = condition['max'] - 10
                else:
                    target_score = 50
                
                # 找到最接近目标分数的选项
                closest_option = min(
                    question['options'],
                    key=lambda opt: abs(opt['score'] * 10 - target_score)
                )
                answers[question['id']] = closest_option['score']
            else:
                # 其他维度选择中等分数
                scores = sorted([opt['score'] for opt in question['options']])
                answers[question['id']] = scores[len(scores) // 2]
        
        percentages = self.calculate_dimension_scores(answers)
        matched = self.match_personality(percentages)
        
        print("\n测试得分:")
        for dim_id, score in percentages.items():
            dim_name = next(d['name'] for d in self.dimensions if d['id'] == dim_id)
            marker = " <-- 关键维度" if dim_id in personality['conditions'] else ""
            print(f"  {dim_name}: {score}%{marker}")
        
        print(f"\n匹配结果:")
        if personality in matched:
            print(f"  ✓ 成功匹配到 '{personality['name']}'")
        else:
            print(f"  ✗ 未能匹配到 '{personality['name']}'")
        
        if len(matched) > 1:
            print(f"\n⚠️ 警告: 同时匹配到 {len(matched)} 个盘格:")
            for p in matched:
                print(f"    - {p['name']}")
        
        return matched
    
    def check_overlapping_conditions(self):
        """检查所有盘格之间是否有重叠的匹配条件"""
        print("\n" + "=" * 60)
        print("检查盘格匹配条件重叠情况")
        print("=" * 60)
        
        overlaps = []
        for i, p1 in enumerate(self.personalities):
            for p2 in self.personalities[i+1:]:
                # 检查两个盘格是否可能同时匹配
                can_overlap = True
                for dim in self.dimensions:
                    dim_id = dim['id']
                    c1 = p1['conditions'].get(dim_id, {})
                    c2 = p2['conditions'].get(dim_id, {})
                    
                    # 如果没有交集，则不可能同时匹配
                    min1, max1 = c1.get('min', 0), c1.get('max', 100)
                    min2, max2 = c2.get('min', 0), c2.get('max', 100)
                    
                    if max1 < min2 or max2 < min1:
                        can_overlap = False
                        break
                
                if can_overlap:
                    overlaps.append((p1, p2))
        
        if overlaps:
            print(f"\n发现 {len(overlaps)} 对可能重叠的盘格:")
            for p1, p2 in overlaps:
                print(f"  - {p1['name']} vs {p2['name']}")
        else:
            print("\n✓ 没有发现重叠的盘格匹配条件")
        
        return overlaps
    
    def run_all_tests(self):
        """运行所有测试"""
        print("\n" + "=" * 60)
        print("UFTI 飞盘盘格评测系统 - 测试工具")
        print("=" * 60)
        
        self.test_all_max_scores()
        self.test_all_min_scores()
        self.test_middle_scores()
        
        # 测试特定盘格
        print("\n" + "=" * 60)
        print("特定盘格验证")
        print("=" * 60)
        for p in self.personalities:
            if p['id'] != 'newbie':  # 萌新没有条件，跳过
                self.test_specific_personality(p['id'])
        
        self.check_overlapping_conditions()
        
        print("\n" + "=" * 60)
        print("测试完成")
        print("=" * 60)


if __name__ == '__main__':
    import sys
    tester = UFTITester()
    tester.run_all_tests()
    sys.stdout.flush()
