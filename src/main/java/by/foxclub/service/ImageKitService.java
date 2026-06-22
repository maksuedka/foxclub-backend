package by.foxclub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

@Service
public class ImageKitService {

    @Value("${imagekit.private-key}")
    private String privateKey;

    @Value("${imagekit.url-endpoint}")
    private String uploadUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String uploadAvatar(MultipartFile file) throws IOException {
        // Basic Auth с private_key:
        String auth = privateKey + ":";
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
        String authHeader = "Basic " + encodedAuth;

        // Тело multipart запроса
        LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", file.getResource());
        body.add("fileName", file.getOriginalFilename());
        body.add("useUniqueFileName", "true");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("Authorization", authHeader);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                uploadUrl,
                HttpMethod.POST,
                requestEntity,
                String.class
        );

        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode json = objectMapper.readTree(response.getBody());
            String url = json.get("url").asText();
            if (url != null && !url.isEmpty()) {
                return url;
            }
        }
        throw new RuntimeException("ImageKit upload error: " + response.getBody());
    }

    // ===== НОВЫЙ МЕТОД ДЛЯ ЗАГРУЗКИ ИЗОБРАЖЕНИЙ АКЦИЙ =====
    public String uploadPromotionImage(MultipartFile file) throws IOException {
        // Можно использовать тот же uploadAvatar, либо расширить логику
        // Например, добавить префикс для файлов акций
        return uploadAvatar(file);
    }
}