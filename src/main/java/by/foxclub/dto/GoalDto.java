package by.foxclub.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Data
public class GoalDto {
    private Integer id;
    private String type;
    private BigDecimal targetValue;
    private BigDecimal currentValue;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
    private Integer userId;

    // Виртуальные поля (хранятся в description как JSON)
    private BigDecimal initialValue;
    private String unit;
    private List<ProgressEntry> history = new ArrayList<>();

    // Поля для валидации через ИИ (не сохраняются в БД)
    private String exercise;
    private String fitnessLevel;
    private String userComment;

    @Data
    public static class ProgressEntry {
        private BigDecimal value;
        private LocalDate date;
    }

    // ObjectMapper с поддержкой JavaTime
    private static final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @JsonIgnore
    public String getDefaultUnit() {
        if ("weight-loss".equals(type) || "mass-gain".equals(type)) return "кг";
        if ("strength".equals(type)) return "кг";
        if ("cardio".equals(type)) return "шагов";
        return "";
    }

    @JsonIgnore
    public void deserializeMetadata() {
        if (description == null || description.isBlank()) {
            this.initialValue = currentValue;
            this.unit = getDefaultUnit();
            this.history = new ArrayList<>();
            if (currentValue != null && startDate != null) {
                ProgressEntry e = new ProgressEntry();
                e.setValue(currentValue);
                e.setDate(startDate);
                history.add(e);
            }
            return;
        }
        try {
            Map<String, Object> map = mapper.readValue(description, Map.class);
            if (map.containsKey("initialValue")) {
                this.initialValue = new BigDecimal(map.get("initialValue").toString());
            } else {
                this.initialValue = currentValue;
            }
            if (map.containsKey("unit")) {
                this.unit = map.get("unit").toString();
            } else {
                this.unit = getDefaultUnit();
            }
            if (map.containsKey("history")) {
                List<Map<String, Object>> raw = (List<Map<String, Object>>) map.get("history");
                this.history = new ArrayList<>();
                for (Map<String, Object> item : raw) {
                    ProgressEntry e = new ProgressEntry();
                    e.setValue(new BigDecimal(item.get("value").toString()));
                    e.setDate(LocalDate.parse(item.get("date").toString()));
                    history.add(e);
                }
            } else {
                this.history = new ArrayList<>();
            }
        } catch (Exception e) {
            log.error("Ошибка десериализации метаданных: {}", e.getMessage());
            this.initialValue = currentValue;
            this.unit = getDefaultUnit();
            this.history = new ArrayList<>();
        }
    }

    @JsonIgnore
    public String serializeMetadata() {
        Map<String, Object> meta = new LinkedHashMap<>();
        if (initialValue == null && currentValue != null) {
            initialValue = currentValue;
        }
        meta.put("initialValue", initialValue != null ? initialValue : currentValue);
        meta.put("unit", unit != null ? unit : getDefaultUnit());
        // Преобразуем history в список карт для безопасной сериализации
        if (history != null && !history.isEmpty()) {
            List<Map<String, Object>> historyList = new ArrayList<>();
            for (ProgressEntry entry : history) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("value", entry.getValue());
                item.put("date", entry.getDate().toString());
                historyList.add(item);
            }
            meta.put("history", historyList);
        } else {
            meta.put("history", new ArrayList<>());
        }

        try {
            String json = mapper.writeValueAsString(meta);
            log.info("Сериализованные метаданные: {}", json);
            return json;
        } catch (JsonProcessingException e) {
            log.error("Ошибка сериализации метаданных: {}", e.getMessage(), e);
            return "{}";
        }
    }
}