package by.foxclub.controller;

import by.foxclub.entity.Promotion;
import by.foxclub.service.ImageKitService;
import by.foxclub.service.PromotionService;
import by.foxclub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;
    private final UserService userService;
    private final ImageKitService imageKitService;

    @GetMapping
    public ResponseEntity<List<Promotion>> getAll() {
        return ResponseEntity.ok(promotionService.getAll());
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody Promotion promotion, @RequestParam Integer userId) {
        try {
            var user = userService.getById(userId);
            if (user == null || !user.getIsAdmin()) {
                return ResponseEntity.status(403).body("Доступ запрещен. Только для администраторов.");
            }
            Promotion created = promotionService.add(promotion);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка добавления акции: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, @RequestParam Integer userId) {
        try {
            var user = userService.getById(userId);
            if (user == null || !user.getIsAdmin()) {
                return ResponseEntity.status(403).body("Доступ запрещен. Только для администраторов.");
            }
            boolean deleted = promotionService.delete(id);
            if (deleted) {
                return ResponseEntity.ok("Акция удалена");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка удаления акции: " + e.getMessage());
        }
    }

    // ===== ЗАГРУЗКА ИЗОБРАЖЕНИЯ ДЛЯ АКЦИИ =====
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(@RequestParam("image") MultipartFile file) {
        try {
            String imageUrl = imageKitService.uploadPromotionImage(file); // метод нужно добавить в ImageKitService
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ошибка загрузки: " + e.getMessage()));
        }
    }
}