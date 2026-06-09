package by.foxclub.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PurchasedAbonementDto {
    private Integer id;
    private Integer userId;
    private Integer abonementId;
    private String abonementName;
    private LocalDate purchaseDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal priceAtPurchase;
}