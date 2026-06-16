package by.foxclub.service;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;

@Slf4j
@Component
public class SimpleKnowledgeBase {

    private final List<TextChunk> chunks = new ArrayList<>();

    @Getter
    private boolean initialized = false;

    @PostConstruct
    public void init() {
        log.info("Загрузка упрощённой базы знаний (PDFBox)...");
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath:knowledge/*.pdf");

            if (resources.length == 0) {
                log.warn("PDF-файлы не найдены в папке knowledge/");
                initialized = true;
                return;
            }

            PDFTextStripper stripper = new PDFTextStripper();
            int totalChunks = 0;

            for (Resource resource : resources) {
                try (InputStream is = resource.getInputStream();
                     PDDocument document = Loader.loadPDF(is.readAllBytes())) {
                    String text = stripper.getText(document);
                    // Разбиваем на абзацы (по пустым строкам)
                    String[] paragraphs = text.split("\\n\\s*\\n");
                    for (String para : paragraphs) {
                        String cleaned = para.trim();
                        if (cleaned.length() > 50) {
                            // Собираем ключевые слова для быстрого поиска (топ-10 самых частых слов)
                            chunks.add(new TextChunk(cleaned));
                            totalChunks++;
                        }
                    }
                    log.info("Обработан PDF: {}, добавлено {} абзацев", resource.getFilename(), paragraphs.length);
                } catch (Exception e) {
                    log.error("Ошибка при обработке PDF: {}", resource.getFilename(), e);
                }
            }

            initialized = true;
            log.info("База знаний загружена. Всего абзацев: {}", totalChunks);
        } catch (Exception e) {
            log.error("Ошибка инициализации базы знаний", e);
            initialized = true;
        }
    }

    public String findRelevantKnowledge(String query, int maxResults) {
        if (!initialized || chunks.isEmpty()) {
            return "";
        }

        // Извлекаем ключевые слова из запроса (убираем стоп-слова)
        List<String> keywords = extractKeywords(query);
        if (keywords.isEmpty()) return "";

        // Считаем релевантность для каждого абзаца (количество совпадений ключевых слов)
        List<ScoredChunk> scored = new ArrayList<>();
        for (TextChunk chunk : chunks) {
            int score = chunk.getKeywordScore(keywords);
            if (score > 0) {
                scored.add(new ScoredChunk(chunk.text, score));
            }
        }

        scored.sort((a, b) -> Integer.compare(b.score, a.score));

        if (scored.isEmpty()) return "";

        StringBuilder result = new StringBuilder();
        result.append("Вот релевантные выдержки из базы знаний:\n\n");
        int count = Math.min(maxResults, scored.size());
        for (int i = 0; i < count; i++) {
            String text = scored.get(i).chunk;
            if (text.length() > 800) text = text.substring(0, 800) + "...";
            result.append(i + 1).append(". ").append(text).append("\n\n");
        }
        return result.toString();
    }

    private List<String> extractKeywords(String query) {
        String[] words = query.toLowerCase().split("\\s+");
        List<String> keywords = new ArrayList<>();
        String[] stopWords = {"тип", "для", "или", "это", "при", "без", "через", "цель", "цели", "уровень", "подготовка", "комментарий", "пользователь"};
        for (String w : words) {
            if (w.length() > 3 && !isStopWord(w, stopWords)) {
                keywords.add(w);
            }
        }
        return keywords;
    }

    private boolean isStopWord(String word, String[] stopWords) {
        for (String sw : stopWords) {
            if (word.equals(sw)) return true;
        }
        return false;
    }

    // Вспомогательный класс для хранения абзаца и его ключевых слов
    private static class TextChunk {
        final String text;
        final String[] words;

        TextChunk(String text) {
            this.text = text;
            // разбиваем на слова и убираем знаки препинания
            this.words = text.toLowerCase().replaceAll("[^а-яa-z\\s]", "").split("\\s+");
        }

        int getKeywordScore(List<String> keywords) {
            int score = 0;
            for (String kw : keywords) {
                for (String w : words) {
                    if (w.contains(kw)) {
                        score++;
                        break;
                    }
                }
            }
            return score;
        }
    }

    private static class ScoredChunk {
        final String chunk;
        final int score;
        ScoredChunk(String chunk, int score) {
            this.chunk = chunk;
            this.score = score;
        }
    }
}