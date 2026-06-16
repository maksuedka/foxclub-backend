package by.foxclub.service;

import by.foxclub.dto.LoginRequest;
import by.foxclub.dto.RegisterRequest;
import by.foxclub.dto.UserDto;
import by.foxclub.entity.User;
import by.foxclub.entity.Club;
import by.foxclub.entity.Admin;
import by.foxclub.mapper.UserMapper;
import by.foxclub.repository.UserRepository;
import by.foxclub.repository.ClubRepository;
import by.foxclub.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final AdminRepository adminRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public List<UserDto> getAll() {
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    public UserDto getById(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        return userMapper.toDto(user);
    }

    public UserDto register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email уже используется");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        if (request.getClubId() != null && request.getClubId() > 0) {
            Club club = clubRepository.findById(request.getClubId())
                    .orElseThrow(() -> new RuntimeException("Клуб не найден"));
            user.setClub(club);
        } else {
            user.setClub(null);
        }

        // ===== ПЕРВЫЙ ПОЛЬЗОВАТЕЛЬ СТАНОВИТСЯ АДМИНОМ =====
        long userCount = userRepository.count();
        boolean isFirstUser = (userCount == 0);
        user.setIsAdmin(isFirstUser);

        User savedUser = userRepository.save(user);

        // ===== ЕСЛИ ПЕРВЫЙ ПОЛЬЗОВАТЕЛЬ – ДОБАВЛЯЕМ В ТАБЛИЦУ АДМИНИСТРАТОРОВ =====
        if (isFirstUser) {
            Admin admin = new Admin();
            admin.setEmail(savedUser.getEmail());
            admin.setPassword(savedUser.getPassword());
            admin.setFirstName(savedUser.getFirstName());
            admin.setLastName(savedUser.getLastName());

            // Если у пользователя нет клуба, берём первый существующий клуб
            if (savedUser.getClub() != null) {
                admin.setClub(savedUser.getClub());
            } else {
                List<Club> clubs = clubRepository.findAll();
                if (!clubs.isEmpty()) {
                    admin.setClub(clubs.get(0));
                } else {
                    // Если клубов нет вообще, создаём временный клуб (можно выбросить исключение)
                    // Вместо исключения создадим клуб "Главный офис"
                    Club defaultClub = new Club();
                    defaultClub.setName("Главный офис");
                    defaultClub.setAddress("г. Минск, ул. Центральная, 1");
                    defaultClub.setContacts("+375 29 123-45-67");
                    defaultClub.setWorkingHours("Пн-Вс 08:00–22:00");
                    clubRepository.save(defaultClub);
                    admin.setClub(defaultClub);
                }
            }
            adminRepository.save(admin);
        }

        return userMapper.toDto(savedUser);
    }

    public UserDto login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Неверный пароль");
        }

        return userMapper.toDto(user);
    }

    public UserDto update(Integer id, UserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());

        // Обновляем клуб, если передан
        if (dto.getClubId() != null && dto.getClubId() > 0) {
            Club club = clubRepository.findById(dto.getClubId())
                    .orElseThrow(() -> new RuntimeException("Клуб не найден"));
            user.setClub(club);
        } else {
            user.setClub(null);
        }

        // Пароль не обновляется через DTO – только через DashboardController
        return userMapper.toDto(userRepository.save(user));
    }

    public void delete(Integer id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Пользователь не найден");
        }
        userRepository.deleteById(id);
    }
}