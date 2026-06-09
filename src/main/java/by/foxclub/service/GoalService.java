package by.foxclub.service;

import by.foxclub.dto.GoalDto;
import by.foxclub.entity.Goal;
import by.foxclub.entity.User;
import by.foxclub.mapper.GoalMapper;
import by.foxclub.repository.GoalRepository;
import by.foxclub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final GoalMapper goalMapper;

    public List<GoalDto> getAll() {
        return goalRepository.findAll().stream()
                .map(goalMapper::toDto)
                .collect(Collectors.toList());
    }

    public GoalDto getById(Integer id) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Цель не найдена"));
        return goalMapper.toDto(goal);
    }

    public GoalDto create(GoalDto dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        Goal goal = goalMapper.toEntity(dto);
        goal.setUser(user);

        return goalMapper.toDto(goalRepository.save(goal));
    }

    public GoalDto update(Integer id, GoalDto dto) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Цель не найдена"));

        goal.setType(dto.getType());
        goal.setDescription(dto.getDescription());
        goal.setTargetValue(dto.getTargetValue());
        goal.setCurrentValue(dto.getCurrentValue());
        goal.setStartDate(dto.getStartDate());
        goal.setEndDate(dto.getEndDate());

        if (dto.getUserId() != null) {
            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            goal.setUser(user);
        }

        return goalMapper.toDto(goalRepository.save(goal));
    }

    public void delete(Integer id) {
        if (!goalRepository.existsById(id)) {
            throw new RuntimeException("Цель не найдена");
        }
        goalRepository.deleteById(id);
    }
}