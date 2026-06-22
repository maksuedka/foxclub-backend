package by.foxclub.service;

import by.foxclub.dto.GoalDto;
import by.foxclub.dto.GoalValidationResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.model}")
    private String model;

    private final SimpleKnowledgeBase knowledgeBase;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GoalValidationResponse validateGoal(GoalDto dto) {
        GoalValidationResponse quickCheck = quickValidate(dto);
        if (quickCheck != null) {
            log.info("Цель отклонена быстрой проверкой: {}", quickCheck.getReason());
            return quickCheck;
        }

        long daysLeft = 0;
        if (dto.getEndDate() != null) {
            daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), dto.getEndDate());
        }

        String prompt = buildPrompt(dto, daysLeft);
        try {
            String responseJson = callGroqApi(prompt);
            log.info("Ответ от Groq API: {}", responseJson);
            return parseResponse(responseJson);
        } catch (Exception e) {
            log.error("Ошибка при вызове Groq API: {}", e.getMessage(), e);
            return new GoalValidationResponse(
                    true,
                    "Проверка ИИ временно недоступна. Цель создана без валидации.",
                    "Рекомендуем проконсультироваться с тренером очно.",
                    "",
                    ""
            );
        }
    }

    private GoalValidationResponse quickValidate(GoalDto dto) {
        if (dto.getCurrentValue() == null || dto.getTargetValue() == null) {
            return new GoalValidationResponse(false, "Не заданы текущее или целевое значение", "", "", "");
        }

        double current = dto.getCurrentValue().doubleValue();
        double target = dto.getTargetValue().doubleValue();
        long days = dto.getEndDate() != null ? ChronoUnit.DAYS.between(LocalDate.now(), dto.getEndDate()) : 0;

        if (days <= 0) {
            return new GoalValidationResponse(false, "Дата окончания должна быть в будущем", "", "", "");
        }

        double weeklyChange = Math.abs(target - current) / (days / 7.0);

        if ("weight-loss".equals(dto.getType())) {
            // Убрана проверка на слишком медленный темп
            if (weeklyChange > 1.5) {
                return new GoalValidationResponse(
                        false,
                        "Слишком быстрый темп похудения (" + String.format("%.2f", weeklyChange) + " кг/нед). Безопасный максимум — 1.5 кг/нед.",
                        "Рекомендуем замедлить темп до 0.5-1 кг в неделю для сохранения здоровья и мышц.",
                        "Резкое похудение может навредить гормональной системе.",
                        "0.5-1 кг"
                );
            }
            if (target < 30) {
                return new GoalValidationResponse(false, "Целевой вес (" + String.format("%.1f", target) + " кг) слишком низкий. Минимальный безопасный вес — 30 кг.", "", "", "");
            }
            if (target < current * 0.5) {
                return new GoalValidationResponse(false, "Похудение более чем на 50% от текущего веса нереалистично.", "", "", "");
            }
            if (target >= current) {
                return new GoalValidationResponse(false, "Целевой вес должен быть меньше текущего (" + String.format("%.1f", current) + " кг).", "", "", "");
            }
        } else if ("mass-gain".equals(dto.getType())) {
            // Убрана проверка на слишком медленный темп
            if (weeklyChange > 1.0) {
                return new GoalValidationResponse(
                        false,
                        "Слишком быстрый набор массы (" + String.format("%.2f", weeklyChange) + " кг/нед). Естественный лимит мышц — 0.2-0.5 кг/нед.",
                        "Рекомендуем набирать 0.2-0.5 кг в неделю, чтобы минимизировать жир.",
                        "Быстрый набор веса ведёт к отложению жира, а не мышц.",
                        "0.2-0.5 кг"
                );
            }
            if (target > current * 2.5) {
                return new GoalValidationResponse(
                        false,
                        "Набор массы до " + String.format("%.1f", target) + " кг нереалистичен. Максимальный разумный вес — " + String.format("%.1f", current * 2.5) + " кг.",
                        "Ставьте более скромные цели, набирайте постепенно.",
                        "Чрезмерный набор веса ведёт к ожирению и проблемам со здоровьем.",
                        "0.2-0.5 кг"
                );
            }
            if (target <= current) {
                return new GoalValidationResponse(false, "Целевой вес должен быть больше текущего (" + String.format("%.1f", current) + " кг).", "", "", "");
            }
        } else if ("strength".equals(dto.getType())) {
            String fitnessLevel = dto.getFitnessLevel() != null ? dto.getFitnessLevel() : "intermediate";
            double maxWeeklyPercent = switch (fitnessLevel) {
                case "beginner" -> 15.0;
                case "intermediate" -> 8.0;
                case "advanced" -> 5.0;
                case "professional" -> 3.0;
                default -> 8.0;
            };
            if (current > 0 && days > 0) {
                double percentChange = (Math.abs(target - current) / current) * 100;
                double weeklyPercent = percentChange / (days / 7.0);
                if (weeklyPercent > maxWeeklyPercent) {
                    return new GoalValidationResponse(
                            false,
                            "Слишком быстрый рост рабочего веса (" + String.format("%.1f", weeklyPercent) + "%%/нед). При вашем уровне подготовки безопасный максимум — " + maxWeeklyPercent + "%%/нед.",
                            "Для вашего уровня подготовки рекомендуем увеличивать вес на " + String.format("%.0f", maxWeeklyPercent) + "%% в неделю. Это даст устойчивый прогресс без травм.",
                            "Резкий скачок веса может привести к травмам.",
                            String.format("%.0f-%.0f%%", maxWeeklyPercent * 0.5, maxWeeklyPercent)
                    );
                }
            }
            double maxRealistic = current * 5;
            if (target > maxRealistic) {
                return new GoalValidationResponse(
                        false,
                        "Целевое значение (" + String.format("%.1f", target) + " " + (dto.getUnit() != null ? dto.getUnit() : "кг") + ") слишком велико. Реалистичный максимум — " + String.format("%.1f", maxRealistic) + ".",
                        "Постепенно увеличивайте нагрузку, не пытайтесь сразу прыгнуть выше головы.",
                        "Резкий скачок веса может привести к травмам.",
                        "индивидуально"
                );
            }
            if (target < 1) {
                return new GoalValidationResponse(false, "Целевое значение не может быть меньше 1 " + (dto.getUnit() != null ? dto.getUnit() : "кг"), "", "", "");
            }
        } else if ("cardio".equals(dto.getType())) {
            if (target > current * 10) {
                return new GoalValidationResponse(
                        false,
                        "Слишком амбициозная цель (" + String.format("%.1f", target) + " " + (dto.getUnit() != null ? dto.getUnit() : "шагов") + "). Реалистично увеличивать нагрузку постепенно.",
                        "Увеличивайте дистанцию на 5-10% в неделю.",
                        "Резкое увеличение нагрузки может привести к травмам.",
                        "5-10% в неделю"
                );
            }
            if (target <= current) {
                return new GoalValidationResponse(false, "Целевое значение должно быть больше текущего (" + String.format("%.1f", current) + " " + (dto.getUnit() != null ? dto.getUnit() : "шагов") + ").", "", "", "");
            }
        }

        return null;
    }

    private String buildPrompt(GoalDto dto, long daysLeft) {
        String type = dto.getType();
        String typeName = switch (type) {
            case "weight-loss" -> "похудение (снижение веса тела)";
            case "mass-gain" -> "набор мышечной массы (увеличение веса тела)";
            case "strength" -> "силовые показатели (увеличение рабочего веса в упражнении)";
            case "cardio" -> "кардионагрузка (улучшение выносливости)";
            default -> type;
        };

        String unit = dto.getUnit() != null ? dto.getUnit() : "кг";
        double initial = dto.getInitialValue() != null ? dto.getInitialValue().doubleValue() : 0;
        double target = dto.getTargetValue() != null ? dto.getTargetValue().doubleValue() : 0;
        double current = dto.getCurrentValue() != null ? dto.getCurrentValue().doubleValue() : 0;

        double weeklyChange = 0;
        if (daysLeft > 0) {
            weeklyChange = Math.abs(target - current) / (daysLeft / 7.0);
        }

        String exercise = dto.getExercise() != null ? dto.getExercise() : "не указано";
        String fitnessLevel = dto.getFitnessLevel() != null ? dto.getFitnessLevel() : "не указан";
        String userComment = dto.getUserComment() != null ? dto.getUserComment() : "нет комментария";

        String fitnessLevelReadable = switch (fitnessLevel) {
            case "beginner" -> "Начинающий (0–3 месяца тренировок)";
            case "intermediate" -> "Средний (3–12 месяцев тренировок)";
            case "advanced" -> "Продвинутый (1–3 года тренировок)";
            case "professional" -> "Профессиональный (3+ лет тренировок)";
            default -> fitnessLevel;
        };

        String searchQuery = String.format(
                "Тип цели: %s, Упражнение: %s, Уровень подготовки: %s, Комментарий: %s",
                typeName, exercise, fitnessLevelReadable, userComment
        );
        String knowledgeContext = knowledgeBase.findRelevantKnowledge(searchQuery, 3);

        String tempoAssessment = switch (type) {
            case "weight-loss" -> {
                if (weeklyChange > 1.5) yield "СЛИШКОМ БЫСТРЫЙ (опасно для здоровья)";
                else if (weeklyChange >= 0.5 && weeklyChange <= 1.0) yield "ОПТИМАЛЬНЫЙ (безопасно и эффективно)";
                else if (weeklyChange > 0 && weeklyChange < 0.5) yield "МЕДЛЕННЫЙ (может быть неэффективен)";
                else yield "НЕ ОПРЕДЕЛЁН";
            }
            case "mass-gain" -> {
                if (weeklyChange > 0.5) yield "СЛИШКОМ БЫСТРЫЙ (в основном жир)";
                else if (weeklyChange >= 0.2 && weeklyChange <= 0.5) yield "ОПТИМАЛЬНЫЙ (мышечная масса)";
                else if (weeklyChange > 0 && weeklyChange < 0.2) yield "МЕДЛЕННЫЙ (возможно, недостаточно калорий)";
                else yield "НЕ ОПРЕДЕЛЁН";
            }
            default -> "НЕ ПРИМЕНИМО";
        };

        String safeRange = switch (type) {
            case "weight-loss" -> "0.5-1 кг в неделю (максимум 1.5 кг для людей с большим весом)";
            case "mass-gain" -> "0.2-0.5 кг в неделю";
            case "strength" -> "зависит от уровня подготовки (2-5%% в месяц для начинающих, 1-2%% для опытных)";
            case "cardio" -> "5-10%% увеличения дистанции/шагов в неделю";
            default -> "индивидуально";
        };

        return """
            Ты — эксперт по фитнесу, питанию и восстановлению с доступом к научной базе знаний.

            %s

            Данные пользователя:
            - Тип цели: %s
            - Упражнение/активность: %s
            - Начальное значение: %.1f %s
            - Текущее значение: %.1f %s
            - Целевое значение: %.1f %s
            - Срок: %d дней
            - Расчётный темп: %.2f %s в неделю
            - Оценка темпа (на основе норм): %s
            - Безопасный диапазон для этого типа: %s
            - Уровень подготовки: %s
            - Комментарий пользователя (содержит его параметры): %s

            Используй информацию из базы знаний для обоснования ответа.
            Прими во внимание вес, рост, возраст, пол, стаж, травмы из комментария.

            Ответь строго в формате JSON:
            {
                "realistic": true/false,
                "reason": "краткое объяснение (1-2 предложения)",
                "recommendation": "рекомендация как достичь цели (2-3 предложения)",
                "warning": "предупреждение о здоровье (если есть, иначе пустая строка)",
                "safeWeeklyChange": "рекомендуемый безопасный темп в неделю"
            }

            Верни только JSON, без лишнего текста.
            """.formatted(
                    knowledgeContext,
                    typeName,
                    exercise,
                    initial, unit,
                    current, unit,
                    target, unit,
                    daysLeft,
                    weeklyChange, unit,
                    tempoAssessment,
                    safeRange,
                    fitnessLevelReadable,
                    userComment
            );
    }

    private String callGroqApi(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", new Object[]{
                        Map.of("role", "system", "content", "Ты — профессиональный фитнес-тренер, диетолог и спортивный физиолог. Отвечай только на русском языке."),
                        Map.of("role", "user", "content", prompt)
                },
                "temperature", 0.2,
                "max_tokens", 700
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            log.error("Ошибка Groq API: статус {}, тело: {}", response.getStatusCode(), response.getBody());
            throw new RuntimeException("Ошибка при обращении к Groq API: " + response.getStatusCode());
        }

        return response.getBody();
    }

    private GoalValidationResponse parseResponse(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode contentNode = root.path("choices").get(0).path("message").path("content");
            String content = contentNode.asText();
            log.info("Содержимое сообщения от Groq: {}", content);

            String jsonString = extractJson(content);
            if (jsonString == null) {
                log.warn("Не удалось извлечь JSON из ответа: {}", content);
                return createFallbackResponse("Не удалось получить рекомендацию от ИИ");
            }

            JsonNode result = objectMapper.readTree(jsonString);
            return new GoalValidationResponse(
                    result.path("realistic").asBoolean(),
                    result.path("reason").asText(),
                    result.path("recommendation").asText(),
                    result.path("warning").asText(),
                    result.path("safeWeeklyChange").asText()
            );

        } catch (Exception e) {
            log.error("Ошибка парсинга ответа Groq: {}", e.getMessage(), e);
            return createFallbackResponse("Ошибка при обработке ответа от ИИ");
        }
    }

    private String extractJson(String text) {
        Pattern pattern = Pattern.compile("\\{(?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*\\}");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    private GoalValidationResponse createFallbackResponse(String reason) {
        return new GoalValidationResponse(
                true,
                reason,
                "Проконсультируйтесь с тренером очно.",
                "",
                ""
        );
    }
}