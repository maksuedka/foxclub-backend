package by.foxclub.service;

import by.foxclub.entity.Promotion;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
public class PromotionService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String DATA_DIR = "data";
    private final String FILE_PATH = DATA_DIR + "/promotions.json";
    private List<Promotion> promotions = new ArrayList<>();
    private AtomicLong idGenerator = new AtomicLong(1);

    @PostConstruct
    public void init() {
        try {
            File dir = new File(DATA_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File file = new File(FILE_PATH);
            if (file.exists()) {
                promotions = objectMapper.readValue(file, new TypeReference<List<Promotion>>() {});
                long maxId = promotions.stream().mapToLong(Promotion::getId).max().orElse(0);
                idGenerator.set(maxId + 1);
                log.info("Загружено {} акций из файла", promotions.size());
            } else {
                // НЕ создаём дефолтные акции — просто пустой список и сохраняем
                promotions = new ArrayList<>();
                saveToFile();
                log.info("Создан пустой файл акций");
            }
        } catch (Exception e) {
            log.error("Ошибка загрузки акций: {}", e.getMessage());
            promotions = new ArrayList<>();
        }
    }

    private void saveToFile() throws IOException {
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(new File(FILE_PATH), promotions);
        log.info("Сохранено {} акций в файл", promotions.size());
    }

    public List<Promotion> getAll() {
        return new ArrayList<>(promotions);
    }

    public Promotion getById(Long id) {
        return promotions.stream().filter(p -> p.getId().equals(id)).findFirst().orElse(null);
    }

    public synchronized Promotion add(Promotion promotion) {
        promotion.setId(idGenerator.getAndIncrement());
        promotions.add(promotion);
        try {
            saveToFile();
        } catch (IOException e) {
            log.error("Ошибка сохранения акции: {}", e.getMessage());
            throw new RuntimeException("Не удалось сохранить акцию");
        }
        return promotion;
    }

    public synchronized boolean delete(Long id) {
        boolean removed = promotions.removeIf(p -> p.getId().equals(id));
        if (removed) {
            try {
                saveToFile();
            } catch (IOException e) {
                log.error("Ошибка сохранения после удаления: {}", e.getMessage());
                throw new RuntimeException("Не удалось удалить акцию");
            }
        }
        return removed;
    }

    public synchronized Promotion update(Long id, Promotion promotion) {
        Promotion existing = getById(id);
        if (existing == null) {
            return null;
        }
        existing.setTitle(promotion.getTitle());
        existing.setDescription(promotion.getDescription());
        existing.setImageUrl(promotion.getImageUrl());
        existing.setLink(promotion.getLink());
        existing.setActive(promotion.isActive());
        try {
            saveToFile();
        } catch (IOException e) {
            log.error("Ошибка обновления акции: {}", e.getMessage());
            throw new RuntimeException("Не удалось обновить акцию");
        }
        return existing;
    }
}