package by.foxclub.controller;

import by.foxclub.repository.*;
import by.foxclub.entity.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
// @CrossOrigin удалён – теперь используются глобальные настройки из WebConfig
public class DashboardController {

    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final AbonementRepository abonementRepository;
    private final GoalRepository goalRepository;
    private final AdminRepository adminRepository;
    private final PurchasedAbonementRepository purchasedAbonementRepository;

    private static final Map<String, String> RU_HEADERS = new HashMap<>();
    static {
        // Пользователь
        RU_HEADERS.put("id", "ID");
        RU_HEADERS.put("email", "Почта");
        RU_HEADERS.put("password", "Пароль");
        RU_HEADERS.put("firstName", "Имя");
        RU_HEADERS.put("lastName", "Фамилия");
        RU_HEADERS.put("club", "Клуб");
        // поле abonementId удалено, так как его больше нет в User

        // Клуб
        RU_HEADERS.put("name", "Название");
        RU_HEADERS.put("address", "Адрес");
        RU_HEADERS.put("contacts", "Контакты");
        RU_HEADERS.put("workingHours", "Время работы");
        // imageUrl удалён

        // Абонемент
        RU_HEADERS.put("abonement_name", "Название");
        RU_HEADERS.put("price", "Цена");
        RU_HEADERS.put("duration", "Длительность");
        RU_HEADERS.put("date", "Дата");

        // Цель
        RU_HEADERS.put("type", "Тип");
        RU_HEADERS.put("targetValue", "Целевое значение");
        RU_HEADERS.put("currentValue", "Текущее значение");
        RU_HEADERS.put("startDate", "Дата начала");
        RU_HEADERS.put("endDate", "Дата окончания");
        RU_HEADERS.put("description", "Описание");
        RU_HEADERS.put("goal_user", "Пользователь");

        // Администратор
        RU_HEADERS.put("admin_email", "Почта");
        RU_HEADERS.put("admin_password", "Пароль");
        RU_HEADERS.put("admin_firstName", "Имя");
        RU_HEADERS.put("admin_lastName", "Фамилия");
        RU_HEADERS.put("admin_club", "Клуб");

        // Приобретенный абонемент
        RU_HEADERS.put("purchased_user", "Пользователь");
        RU_HEADERS.put("purchased_abonement", "Абонемент");
        RU_HEADERS.put("purchaseDate", "Дата покупки");
        RU_HEADERS.put("purchased_startDate", "Дата начала");
        RU_HEADERS.put("purchased_endDate", "Дата окончания");
        RU_HEADERS.put("priceAtPurchase", "Цена покупки");
    }

    @GetMapping("/tables")
    public List<Map<String, String>> getTableNames() {
        return List.of(
                Map.of("key", "users", "label", "Пользователи"),
                Map.of("key", "clubs", "label", "Клубы"),
                Map.of("key", "abonements", "label", "Абонементы"),
                Map.of("key", "purchased-abonements", "label", "Приобретенные абонементы"),
                Map.of("key", "goals", "label", "Цели"),
                Map.of("key", "admins", "label", "Администраторы")
        );
    }

    @GetMapping("/data/{tableName}")
    public ResponseEntity<?> getTableData(@PathVariable String tableName) {
        try {
            List<?> rawData = getListByTableName(tableName);
            Class<?> entityClass = getEntityClass(tableName);

            List<Map<String, String>> headers = new ArrayList<>();

            headers.add(Map.of("key", "id", "title", "ID"));

            for (Field field : entityClass.getDeclaredFields()) {
                if (Collection.class.isAssignableFrom(field.getType()) || field.getName().equals("id")) {
                    continue;
                }

                if (field.getName().equals("abonements") || field.getName().equals("goals")) {
                    continue;
                }

                Map<String, String> header = new HashMap<>();
                String key = field.getName();
                String prefixedKey = tableName + "_" + key;
                header.put("key", key);
                header.put("title", RU_HEADERS.getOrDefault(prefixedKey,
                        RU_HEADERS.getOrDefault(key, field.getName())));
                headers.add(header);
            }

            List<Map<String, Object>> safeData = sanitizeData(rawData);

            Map<String, Object> response = new HashMap<>();
            response.put("headers", headers);
            response.put("data", safeData);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Ошибка сервера: " + e.getMessage());
        }
    }

    @PostMapping("/save/{tableName}")
    @Transactional
    public ResponseEntity<?> saveData(@PathVariable String tableName, @RequestBody Map<String, Object> payload) {
        try {
            Integer id = payload.containsKey("id") && payload.get("id") != null && !payload.get("id").toString().isEmpty()
                    ? Integer.valueOf(payload.get("id").toString()) : null;

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            switch (tableName.toLowerCase()) {
                case "users":
                    User user = (id != null) ? userRepository.findById(id).orElse(new User()) : new User();
                    user.setEmail(getString(payload, "email"));
                    user.setPassword(getString(payload, "password"));
                    user.setFirstName(getString(payload, "firstName"));
                    user.setLastName(getString(payload, "lastName"));
                    // user.setAbonementId(...) – удалено, так как поля больше нет

                    Integer clubId = getInteger(payload, "club");
                    if (clubId != null) {
                        user.setClub(clubRepository.findById(clubId).orElse(null));
                    } else {
                        user.setClub(null);
                    }

                    userRepository.save(user);
                    break;

                case "clubs":
                    Club club = (id != null) ? clubRepository.findById(id).orElse(new Club()) : new Club();
                    club.setName(getString(payload, "name"));
                    club.setAddress(getString(payload, "address"));
                    club.setContacts(getString(payload, "contacts"));
                    club.setWorkingHours(getString(payload, "workingHours"));
                    // setImageUrl удалён
                    clubRepository.save(club);
                    break;

                case "abonements":
                    Abonement abonement = (id != null) ? abonementRepository.findById(id).orElse(new Abonement()) : new Abonement();
                    abonement.setName(getString(payload, "name"));
                    abonement.setPrice(getBigDecimal(payload, "price"));
                    abonement.setDuration(getInteger(payload, "duration"));
                    abonement.setDate(getLocalDate(payload, "date", formatter));
                    abonementRepository.save(abonement);
                    break;

                case "goals":
                    Goal goal = (id != null) ? goalRepository.findById(id).orElse(new Goal()) : new Goal();
                    goal.setType(getString(payload, "type"));
                    goal.setDescription(getString(payload, "description"));
                    goal.setTargetValue(getBigDecimal(payload, "targetValue"));
                    goal.setCurrentValue(getBigDecimal(payload, "currentValue"));
                    goal.setStartDate(getLocalDate(payload, "startDate", formatter));
                    goal.setEndDate(getLocalDate(payload, "endDate", formatter));

                    Integer goalUserId = getInteger(payload, "user");
                    if (goalUserId != null) {
                        goal.setUser(userRepository.findById(goalUserId).orElse(null));
                    }

                    goalRepository.save(goal);
                    break;

                case "admins":
                    Admin admin = (id != null) ? adminRepository.findById(id).orElse(new Admin()) : new Admin();
                    admin.setEmail(getString(payload, "email"));
                    admin.setPassword(getString(payload, "password"));
                    admin.setFirstName(getString(payload, "firstName"));
                    admin.setLastName(getString(payload, "lastName"));

                    Integer adminClubId = getInteger(payload, "club");
                    if (adminClubId != null) {
                        admin.setClub(clubRepository.findById(adminClubId).orElse(null));
                    }

                    adminRepository.save(admin);
                    break;

                case "purchased-abonements":
                    PurchasedAbonement purchasedAbonement = (id != null) ?
                            purchasedAbonementRepository.findById(id).orElse(new PurchasedAbonement()) :
                            new PurchasedAbonement();

                    Integer userId = getInteger(payload, "user");
                    if (userId != null) {
                        purchasedAbonement.setUser(userRepository.findById(userId).orElse(null));
                    }

                    Integer abonementId = getInteger(payload, "abonement");
                    if (abonementId != null) {
                        purchasedAbonement.setAbonement(abonementRepository.findById(abonementId).orElse(null));
                    }

                    purchasedAbonement.setPurchaseDate(getLocalDate(payload, "purchaseDate", formatter));
                    purchasedAbonement.setStartDate(getLocalDate(payload, "startDate", formatter));
                    purchasedAbonement.setEndDate(getLocalDate(payload, "endDate", formatter));
                    purchasedAbonement.setPriceAtPurchase(getBigDecimal(payload, "priceAtPurchase"));

                    purchasedAbonementRepository.save(purchasedAbonement);
                    break;

                default:
                    return ResponseEntity.badRequest().body("Неизвестная таблица");
            }

            return ResponseEntity.ok("Сохранено успешно");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Ошибка сохранения: " + e.getMessage());
        }
    }

    @PostMapping("/delete/{tableName}")
    @Transactional
    public ResponseEntity<?> deleteBatch(@PathVariable String tableName, @RequestBody List<Integer> ids) {
        List<Integer> successfullyDeleted = new ArrayList<>();
        List<Integer> failedToDelete = new ArrayList<>();

        try {
            switch (tableName.toLowerCase()) {
                case "users":
                    for (Integer id : ids) {
                        try {
                            deleteUserDependencies(id);
                            userRepository.deleteById(id);
                            successfullyDeleted.add(id);
                        } catch (Exception e) {
                            failedToDelete.add(id);
                        }
                    }
                    break;

                case "clubs":
                    for (Integer id : ids) {
                        try {
                            deleteClubDependencies(id);
                            clubRepository.deleteById(id);
                            successfullyDeleted.add(id);
                        } catch (Exception e) {
                            failedToDelete.add(id);
                        }
                    }
                    break;

                case "abonements":
                    for (Integer id : ids) {
                        try {
                            abonementRepository.deleteById(id);
                            successfullyDeleted.add(id);
                        } catch (Exception e) {
                            failedToDelete.add(id);
                        }
                    }
                    break;

                case "goals":
                    for (Integer id : ids) {
                        try {
                            goalRepository.deleteById(id);
                            successfullyDeleted.add(id);
                        } catch (Exception e) {
                            failedToDelete.add(id);
                        }
                    }
                    break;

                case "admins":
                    for (Integer id : ids) {
                        try {
                            adminRepository.deleteById(id);
                            successfullyDeleted.add(id);
                        } catch (Exception e) {
                            failedToDelete.add(id);
                        }
                    }
                    break;

                case "purchased-abonements":
                    for (Integer id : ids) {
                        try {
                            purchasedAbonementRepository.deleteById(id);
                            successfullyDeleted.add(id);
                        } catch (Exception e) {
                            failedToDelete.add(id);
                        }
                    }
                    break;

                default:
                    return ResponseEntity.badRequest().body("Неизвестная таблица");
            }

            if (failedToDelete.isEmpty()) {
                return ResponseEntity.ok("Успешно удалено записей: " + successfullyDeleted.size());
            } else {
                return ResponseEntity.badRequest().body("Удалено: " + successfullyDeleted.size() +
                        ", не удалось: " + failedToDelete.size());
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Ошибка удаления: " + e.getMessage());
        }
    }

    @GetMapping("/export/{tableName}")
    public ResponseEntity<byte[]> exportToExcel(@PathVariable String tableName) {
        try {
            List<?> rawData = getListByTableName(tableName);
            List<Map<String, Object>> data = sanitizeData(rawData);

            StringBuilder sb = new StringBuilder();
            sb.append("<html><head><meta charset='utf-8'></head><body><table border='1'>");

            if (!data.isEmpty()) {
                sb.append("<tr>");
                for (String key : data.get(0).keySet()) {
                    String prefixedKey = tableName + "_" + key;
                    sb.append("<th style='background:#ddd;'>")
                            .append(RU_HEADERS.getOrDefault(prefixedKey,
                                    RU_HEADERS.getOrDefault(key, key)))
                            .append("</th>");
                }
                sb.append("</tr>");

                for (Map<String, Object> row : data) {
                    sb.append("<tr>");
                    for (Object val : row.values()) {
                        sb.append("<td>").append(val != null ? val : "").append("</table>");
                    }
                    sb.append("</table>");
                }
            }
            sb.append("</table></body></html>");

            byte[] content = sb.toString().getBytes(StandardCharsets.UTF_8);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + tableName + "_export.xls")
                    .header(HttpHeaders.CONTENT_TYPE, "application/vnd.ms-excel")
                    .body(content);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new byte[0]);
        }
    }

    private String getString(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        return value != null && !value.toString().isEmpty() ? value.toString() : null;
    }

    private Integer getInteger(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null || value.toString().isEmpty()) return null;
        try {
            return Integer.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal getBigDecimal(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null || value.toString().isEmpty()) return null;
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDate getLocalDate(Map<String, Object> payload, String key, DateTimeFormatter formatter) {
        Object value = payload.get(key);
        if (value == null || value.toString().isEmpty()) return null;
        try {
            return LocalDate.parse(value.toString(), formatter);
        } catch (Exception e) {
            return null;
        }
    }

    private List<?> getListByTableName(String tableName) {
        switch (tableName.toLowerCase()) {
            case "users": return userRepository.findAll();
            case "clubs": return clubRepository.findAll();
            case "abonements": return abonementRepository.findAll();
            case "purchased-abonements": return purchasedAbonementRepository.findAll();
            case "goals": return goalRepository.findAll();
            case "admins": return adminRepository.findAll();
            default: return List.of();
        }
    }

    private Class<?> getEntityClass(String tableName) {
        switch (tableName.toLowerCase()) {
            case "users": return User.class;
            case "clubs": return Club.class;
            case "abonements": return Abonement.class;
            case "purchased-abonements": return PurchasedAbonement.class;
            case "goals": return Goal.class;
            case "admins": return Admin.class;
            default: return Object.class;
        }
    }

    private void deleteUserDependencies(Integer userId) {
        List<Goal> goals = goalRepository.findAll().stream()
                .filter(g -> g.getUser() != null && userId.equals(g.getUser().getId()))
                .collect(Collectors.toList());
        if (!goals.isEmpty()) {
            goalRepository.deleteAll(goals);
        }

        List<PurchasedAbonement> purchasedAbonements = purchasedAbonementRepository.findAll().stream()
                .filter(p -> p.getUser() != null && userId.equals(p.getUser().getId()))
                .collect(Collectors.toList());
        if (!purchasedAbonements.isEmpty()) {
            purchasedAbonementRepository.deleteAll(purchasedAbonements);
        }
    }

    private void deleteClubDependencies(Integer clubId) {
        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.getClub() != null && clubId.equals(u.getClub().getId()))
                .collect(Collectors.toList());
        for (User user : users) {
            user.setClub(null);
            userRepository.save(user);
        }

        List<Admin> admins = adminRepository.findAll().stream()
                .filter(a -> a.getClub() != null && clubId.equals(a.getClub().getId()))
                .collect(Collectors.toList());
        for (Admin admin : admins) {
            admin.setClub(null);
            adminRepository.save(admin);
        }
    }

    private List<Map<String, Object>> sanitizeData(List<?> list) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (list == null || list.isEmpty()) return result;

        for (Object entity : list) {
            Map<String, Object> map = new LinkedHashMap<>();

            try {
                Field idField = entity.getClass().getDeclaredField("id");
                idField.setAccessible(true);
                map.put("id", idField.get(entity));

                Field[] fields = entity.getClass().getDeclaredFields();
                for (Field field : fields) {
                    field.setAccessible(true);
                    String fieldName = field.getName();

                    if (fieldName.equals("id") || Collection.class.isAssignableFrom(field.getType())) {
                        continue;
                    }

                    Object value = field.get(entity);

                    if (value != null) {
                        // Для связанных сущностей берем только ID
                        if (value.getClass().getName().startsWith("by.foxclub.entity")) {
                            try {
                                Field relIdField = value.getClass().getDeclaredField("id");
                                relIdField.setAccessible(true);
                                map.put(fieldName, relIdField.get(value));
                            } catch (Exception e) {
                                map.put(fieldName, null);
                            }
                        } else {
                            map.put(fieldName, value);
                        }
                    } else {
                        map.put(fieldName, null);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            result.add(map);
        }
        return result;
    }
}