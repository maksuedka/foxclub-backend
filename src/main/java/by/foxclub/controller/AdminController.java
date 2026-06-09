package by.foxclub.controller;

import by.foxclub.dto.AdminDto;
import by.foxclub.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admins")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<List<AdminDto>> getAll() {
        return ResponseEntity.ok(adminService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(adminService.getById(id));
    }

    @PostMapping
    public ResponseEntity<AdminDto> create(@RequestBody AdminDto adminDto) {
        return ResponseEntity.ok(adminService.create(adminDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminDto> update(@PathVariable Integer id, @RequestBody AdminDto adminDto) {
        return ResponseEntity.ok(adminService.update(id, adminDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        adminService.delete(id);
        return ResponseEntity.ok().build();
    }
}