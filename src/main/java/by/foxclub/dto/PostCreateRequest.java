package by.foxclub.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class PostCreateRequest {
    private Integer userId; // будет игнорироваться в сервисе, используем authorId из контроллера/запроса
    private String text;
    private List<MultipartFile> images;
}

