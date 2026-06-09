package by.foxclub.dto;

import lombok.Data;

@Data
public class CommentCreateRequest {
    private Integer userId;
    private Integer postId;
    private String text;
}

