package by.foxclub.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Promotion {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private String link;
    private boolean active = true;
}