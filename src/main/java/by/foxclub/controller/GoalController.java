package by.foxclub.controller;

import by.foxclub.dto.GoalDto;
import by.foxclub.dto.GoalValidationResponse;
import by.foxclub.service.GoalService;
import by.foxclub.service.GroqService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GoalController {

    private final GoalService goalService;
    private final GroqService groqService;  // новый сервис для работы с Groq API

    @GetMapping
    public ResponseEntity<List<GoalDto>> getAll() {
        return ResponseEntity.ok(goalService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoalDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(goalService.getById(id));
    }

    @PostMapping
    public ResponseEntity<GoalDto> create(@RequestBody GoalDto dto) {
        return ResponseEntity.ok(goalService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalDto> update(@PathVariable Integer id,
                                          @RequestBody GoalDto dto) {
        return ResponseEntity.ok(goalService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        goalService.delete(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Новый эндпоинт для проверки цели через ИИ (Groq)
     * Принимает GoalDto, возвращает рекомендации и оценку реалистичности
     */
    @PostMapping("/validate")
    public ResponseEntity<GoalValidationResponse> validateGoal(@RequestBody GoalDto dto) {
        GoalValidationResponse response = groqService.validateGoal(dto);
        return ResponseEntity.ok(response);
    }
}