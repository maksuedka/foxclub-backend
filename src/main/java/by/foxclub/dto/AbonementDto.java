package by.foxclub.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AbonementDto {
    private Integer id;
    private String name;
    private BigDecimal price;
    private Integer duration;
    private LocalDate date;

}