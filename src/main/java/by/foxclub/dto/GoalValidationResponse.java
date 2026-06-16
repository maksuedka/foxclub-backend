package by.foxclub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoalValidationResponse {
    private boolean realistic;        // реалистична ли цель
    private String reason;            // краткое объяснение
    private String recommendation;    // рекомендации по достижению
    private String warning;           // предупреждение о здоровье (если есть)
    private String safeWeeklyChange;  // безопасный темп в неделю (например, "0.5-1 кг")
}