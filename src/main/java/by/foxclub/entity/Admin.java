package by.foxclub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "администратор")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_администратора")
    private Integer id;

    @Column(name = "email")
    private String email;

    @Column(name = "пароль")
    private String password;

    @Column(name = "имя")
    private String firstName;

    @Column(name = "фамилия")
    private String lastName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_клуба")
    @ToString.Exclude
    private Club club;
}