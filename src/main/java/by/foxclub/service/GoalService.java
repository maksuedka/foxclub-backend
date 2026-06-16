package by.foxclub.service;

import by.foxclub.dto.GoalDto;
import by.foxclub.dto.GoalDto.ProgressEntry;
import by.foxclub.entity.Goal;
import by.foxclub.entity.User;
import by.foxclub.mapper.GoalMapper;
import by.foxclub.repository.GoalRepository;
import by.foxclub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final GoalMapper goalMapper;

    public List<GoalDto> getAll() {
        return goalRepository.findAll().stream()
                .map(this::toDtoWithMetadata)
                .collect(Collectors.toList());
    }

    public GoalDto getById(Integer id) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Цель не найдена"));
        return toDtoWithMetadata(goal);
    }

    public GoalDto create(GoalDto dto) {
        log.info("=== CREATE GOAL ===");
        log.info("Received DTO: {}", dto);
        log.info("initialValue: {}", dto.getInitialValue());
        log.info("unit: {}", dto.getUnit());
        log.info("history: {}", dto.getHistory());

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Подготовка метаданных
        if (dto.getInitialValue() == null) {
            dto.setInitialValue(dto.getCurrentValue());
        }
        if (dto.getHistory() == null) dto.setHistory(new ArrayList<>());
        if (dto.getHistory().isEmpty() && dto.getCurrentValue() != null) {
            ProgressEntry entry = new ProgressEntry();
            entry.setValue(dto.getCurrentValue());
            entry.setDate(dto.getStartDate() != null ? dto.getStartDate() : LocalDate.now());
            dto.getHistory().add(entry);
        }
        if (dto.getUnit() == null) {
            dto.setUnit(dto.getDefaultUnit());
        }

        // Сохраняем метаданные в description
        String serialized = dto.serializeMetadata();
        log.info("Serialized description: {}", serialized);
        dto.setDescription(serialized);

        Goal goal = goalMapper.toEntity(dto);
        log.info("Goal entity after mapping, description: {}", goal.getDescription());

        goal.setUser(user);
        Goal saved = goalRepository.save(goal);
        log.info("Saved goal description: {}", saved.getDescription());

        return toDtoWithMetadata(saved);
    }

    public GoalDto update(Integer id, GoalDto dto) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Цель не найдена"));

        GoalDto existing = toDtoWithMetadata(goal);

        goal.setType(dto.getType());
        goal.setTargetValue(dto.getTargetValue());
        goal.setStartDate(dto.getStartDate());
        goal.setEndDate(dto.getEndDate());

        boolean valueChanged = dto.getCurrentValue() != null &&
                (goal.getCurrentValue() == null || dto.getCurrentValue().compareTo(goal.getCurrentValue()) != 0);

        if (valueChanged) {
            goal.setCurrentValue(dto.getCurrentValue());
            if (existing.getHistory() == null) existing.setHistory(new ArrayList<>());
            ProgressEntry entry = new ProgressEntry();
            entry.setValue(dto.getCurrentValue());
            entry.setDate(LocalDate.now());
            existing.getHistory().add(entry);
        }

        if (existing.getInitialValue() == null && goal.getCurrentValue() != null) {
            existing.setInitialValue(goal.getCurrentValue());
        }

        if (dto.getUnit() != null && !dto.getUnit().equals(existing.getUnit())) {
            existing.setUnit(dto.getUnit());
        } else if (existing.getUnit() == null) {
            existing.setUnit(existing.getDefaultUnit());
        }

        existing.setDescription(existing.serializeMetadata());
        goal.setDescription(existing.getDescription());

        if (dto.getUserId() != null) {
            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            goal.setUser(user);
        }

        Goal updated = goalRepository.save(goal);
        return toDtoWithMetadata(updated);
    }

    public void delete(Integer id) {
        if (!goalRepository.existsById(id)) {
            throw new RuntimeException("Цель не найдена");
        }
        goalRepository.deleteById(id);
    }

    private GoalDto toDtoWithMetadata(Goal goal) {
        GoalDto dto = goalMapper.toDto(goal);
        dto.deserializeMetadata();
        return dto;
    }
}