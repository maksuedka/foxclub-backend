package by.foxclub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "клуб")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_клуба")
    private Integer id;

    @Column(name = "название")
    private String name;

    @Column(name = "адрес")
    private String address;

    @Column(name = "контакты")
    private String contacts;

    @Column(name = "время_работы")
    private String workingHours;

    @Column(name = "изображение")
    private String imageUrl;
}