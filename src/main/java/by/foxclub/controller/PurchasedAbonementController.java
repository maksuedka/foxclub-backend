package by.foxclub.controller;

import by.foxclub.dto.PurchasedAbonementDto;
import by.foxclub.service.PurchasedAbonementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchased-abonements")
@RequiredArgsConstructor
public class PurchasedAbonementController {

    private final PurchasedAbonementService purchasedAbonementService;

    @GetMapping
    public ResponseEntity<List<PurchasedAbonementDto>> getAll() {
        return ResponseEntity.ok(purchasedAbonementService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchasedAbonementDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(purchasedAbonementService.getById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PurchasedAbonementDto>> getByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(purchasedAbonementService.getByUserId(userId));
    }

    @GetMapping("/user/{userId}/active")
    public ResponseEntity<List<PurchasedAbonementDto>> getActiveByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(purchasedAbonementService.getActiveByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<PurchasedAbonementDto> create(@RequestBody PurchasedAbonementDto dto) {
        return ResponseEntity.ok(purchasedAbonementService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PurchasedAbonementDto> update(@PathVariable Integer id, @RequestBody PurchasedAbonementDto dto) {
        return ResponseEntity.ok(purchasedAbonementService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        purchasedAbonementService.delete(id);
        return ResponseEntity.ok().build();
    }

    // ===== НОВЫЙ ЭНДПОЙНТ ДЛЯ АКТИВАЦИИ =====
    @PutMapping("/{id}/activate")
    public ResponseEntity<PurchasedAbonementDto> activate(@PathVariable Integer id) {
        return ResponseEntity.ok(purchasedAbonementService.activate(id));
    }
}