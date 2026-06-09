package by.foxclub.controller;

import by.foxclub.dto.AbonementDto;
import by.foxclub.service.AbonementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/abonements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AbonementController {

    private final AbonementService abonementService;

    @GetMapping
    public ResponseEntity<List<AbonementDto>> getAll() {
        return ResponseEntity.ok(abonementService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AbonementDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(abonementService.getById(id));
    }

    @PostMapping
    public ResponseEntity<AbonementDto> create(@RequestBody AbonementDto dto) {
        return ResponseEntity.ok(abonementService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AbonementDto> update(@PathVariable Integer id,
                                               @RequestBody AbonementDto dto) {
        return ResponseEntity.ok(abonementService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        abonementService.delete(id);
        return ResponseEntity.ok().build();
    }
}