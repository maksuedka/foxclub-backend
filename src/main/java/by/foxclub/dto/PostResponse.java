package by.foxclub.dto;

import by.foxclub.entity.PostStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostResponse {
    private Integer id;
    private Integer authorId;
    private String authorFirstName;
    private String authorLastName;
    private String text;
    private PostStatus status;
    private LocalDateTime createdAt;
    private List<String> images;
}

