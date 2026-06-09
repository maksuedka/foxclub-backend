package by.foxclub.controller;

import by.foxclub.entity.PurchasedAbonement;
import by.foxclub.entity.User;
import by.foxclub.entity.Abonement;
import by.foxclub.repository.PurchasedAbonementRepository;
import by.foxclub.repository.UserRepository;
import by.foxclub.repository.AbonementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/scan")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://127.0.0.1:5500", "http://localhost:5500"})
public class ScanController {

    private final PurchasedAbonementRepository purchasedRepository;
    private final UserRepository userRepository;
    private final AbonementRepository abonementRepository;

    @GetMapping("/{qrData}")
    public ResponseEntity<?> scanAbonement(@PathVariable String qrData) {
        try {

            if (qrData.startsWith("USER-")) {

                return handleUserQr(qrData);

            } else if (qrData.startsWith("FC-")) {

                return handleAbonementQr(qrData);

            } else {
                return ResponseEntity.badRequest().body("Неверный формат QR-кода. Ожидается USER-{id} или FC-{id}-{userId}");
            }

        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Неверный формат чисел в QR-коде");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка: " + e.getMessage());
        }
    }

    private ResponseEntity<?> handleUserQr(String qrData) {
        try {
            Integer userId = Integer.parseInt(qrData.substring(5));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

            List<PurchasedAbonement> abonements = purchasedRepository.findAll().stream()
                    .filter(p -> p.getUser() != null && p.getUser().getId().equals(userId))
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();

            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("firstName", user.getFirstName());
            userData.put("lastName", user.getLastName());
            userData.put("email", user.getEmail());
            if (user.getClub() != null) {
                userData.put("club", user.getClub().getName());
            }
            response.put("user", userData);

            List<Map<String, Object>> abonementsList = new ArrayList<>();
            LocalDate now = LocalDate.now();

            for (PurchasedAbonement p : abonements) {
                Map<String, Object> abonementData = new HashMap<>();
                abonementData.put("id", p.getId());
                abonementData.put("abonementId", p.getAbonement().getId());
                abonementData.put("name", p.getAbonement().getName());
                abonementData.put("purchaseDate", p.getPurchaseDate());
                abonementData.put("startDate", p.getStartDate());
                abonementData.put("endDate", p.getEndDate());
                abonementData.put("priceAtPurchase", p.getPriceAtPurchase());

                boolean isActive = p.getEndDate() != null && !p.getEndDate().isBefore(now);
                abonementData.put("isActive", isActive);

                if (isActive) {
                    long daysLeft = ChronoUnit.DAYS.between(now, p.getEndDate());
                    abonementData.put("daysLeft", daysLeft);
                } else {
                    abonementData.put("daysLeft", 0);
                }

                abonementsList.add(abonementData);
            }

            response.put("abonements", abonementsList);
            response.put("totalAbonements", abonementsList.size());
            response.put("qrCode", qrData);
            response.put("type", "USER");

            return ResponseEntity.ok(response);

        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Неверный формат ID пользователя");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка: " + e.getMessage());
        }
    }

    private ResponseEntity<?> handleAbonementQr(String qrData) {
        try {
            String[] parts = qrData.substring(3).split("-");
            if (parts.length != 2) {
                return ResponseEntity.badRequest().body("Неверный формат QR-кода абонемента");
            }

            Integer purchasedId = Integer.parseInt(parts[0]);
            Integer userId = Integer.parseInt(parts[1]);

            PurchasedAbonement purchased = purchasedRepository.findById(purchasedId)
                    .orElseThrow(() -> new RuntimeException("Абонемент не найден"));

            if (!purchased.getUser().getId().equals(userId)) {
                return ResponseEntity.badRequest().body("Несоответствие данных");
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

            Abonement abonement = abonementRepository.findById(purchased.getAbonement().getId())
                    .orElseThrow(() -> new RuntimeException("Абонемент не найден"));

            Map<String, Object> response = new HashMap<>();
            response.put("id", purchased.getId());
            response.put("qrCode", qrData);
            response.put("type", "ABONEMENT");

            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("firstName", user.getFirstName());
            userData.put("lastName", user.getLastName());
            userData.put("email", user.getEmail());
            if (user.getClub() != null) {
                userData.put("club", user.getClub().getName());
            }
            response.put("user", userData);

            Map<String, Object> abonementData = new HashMap<>();
            abonementData.put("id", abonement.getId());
            abonementData.put("name", abonement.getName());
            abonementData.put("price", abonement.getPrice());
            abonementData.put("duration", abonement.getDuration());
            response.put("abonement", abonementData);

            response.put("purchaseDate", purchased.getPurchaseDate());
            response.put("startDate", purchased.getStartDate());
            response.put("endDate", purchased.getEndDate());
            response.put("priceAtPurchase", purchased.getPriceAtPurchase());

            LocalDate now = LocalDate.now();
            boolean isActive = purchased.getEndDate() != null &&
                    !purchased.getEndDate().isBefore(now);
            response.put("isActive", isActive);

            if (isActive && purchased.getEndDate() != null) {
                long daysLeft = ChronoUnit.DAYS.between(now, purchased.getEndDate());
                response.put("daysLeft", daysLeft);
            } else {
                response.put("daysLeft", 0);
            }

            return ResponseEntity.ok(response);

        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Неверный формат чисел в QR-коде");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка: " + e.getMessage());
        }
    }
}