package by.foxclub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

@Entity
@Table(name = "пользователь")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_пользователя")
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

    @Column(name = "id_абонемента")
    private Integer abonementId;  // Просто ID абонемента, не связь

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    private List<Goal> goals;

    // НОВОЕ ПОЛЕ ДЛЯ АВАТАРА
    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "is_admin")
    private Boolean isAdmin;
}