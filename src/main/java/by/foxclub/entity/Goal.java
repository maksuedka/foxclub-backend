package by.foxclub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "цель")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_цели")
    private Integer id;

    @Column(name = "тип")
    private String type;

    @Column(name = "целевое_значение")
    private BigDecimal targetValue;

    @Column(name = "текущее_значение")
    private BigDecimal currentValue;

    @Column(name = "дата_начала")
    private LocalDate startDate;

    @Column(name = "дата_окончания")
    private LocalDate endDate;

    @Column(name = "описание")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_пользователя")
    @ToString.Exclude
    private User user;
}