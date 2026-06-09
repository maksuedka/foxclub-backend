package by.foxclub.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CommentResponse {
    private Integer id;
    private Integer postId;
    private Integer authorId;
    private String authorFirstName;
    private String authorLastName;
    private String text;
    private LocalDateTime createdAt;
}

