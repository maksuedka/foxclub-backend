package by.foxclub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "приобретенный_абонемент")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchasedAbonement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_приобретенного")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_пользователя", nullable = false)
    @ToString.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_абонемента", nullable = false)
    @ToString.Exclude
    private Abonement abonement;

    @Column(name = "дата_покупки", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "дата_начала")
    private LocalDate startDate;

    @Column(name = "дата_окончания")
    private LocalDate endDate;

    @Column(name = "цена_на_момент_покупки", precision = 10, scale = 2)
    private BigDecimal priceAtPurchase;
}