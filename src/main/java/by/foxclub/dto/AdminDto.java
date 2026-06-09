package by.foxclub.dto;

import lombok.Data;

@Data
public class AdminDto {
    private Integer id;
    private String email;
    private String firstName;
    private String lastName;

    private Integer clubId;
}