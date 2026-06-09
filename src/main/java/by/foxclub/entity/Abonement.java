package by.foxclub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "абонемент")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Abonement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_абонемента")
    private Integer id;

    @Column(name = "название")
    private String name;

    @Column(name = "цена")
    private BigDecimal price;

    @Column(name = "дата")
    private LocalDate date;

    @Column(name = "длительность")
    private Integer duration;

}