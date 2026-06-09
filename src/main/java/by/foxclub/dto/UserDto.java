package by.foxclub.dto;

import lombok.Data;

@Data
public class UserDto {
    private Integer id;
    private String email;
    private String firstName;
    private String lastName;
    private Integer clubId;
    private Integer abonementId;
    private String avatarUrl;   // добавлено
}