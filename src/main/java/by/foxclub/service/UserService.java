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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
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
    private final JavaMailSender mailSender;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    // ===== ВОССТАНОВЛЕНИЕ ПАРОЛЯ: временное хранение токенов =====
    private final Map<String, TokenData> resetTokens = new ConcurrentHashMap<>();

    private static class TokenData {
        String token;
        String email;
        LocalDateTime expiry;

        TokenData(String token, String email, LocalDateTime expiry) {
            this.token = token;
            this.email = email;
            this.expiry = expiry;
        }
    }

    // ===== ОСНОВНЫЕ МЕТОДЫ =====

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

        long userCount = userRepository.count();
        boolean isFirstUser = (userCount == 0);
        user.setIsAdmin(isFirstUser);

        User savedUser = userRepository.save(user);

        if (isFirstUser) {
            Admin admin = new Admin();
            admin.setEmail(savedUser.getEmail());
            admin.setPassword(savedUser.getPassword());
            admin.setFirstName(savedUser.getFirstName());
            admin.setLastName(savedUser.getLastName());

            if (savedUser.getClub() != null) {
                admin.setClub(savedUser.getClub());
            } else {
                List<Club> clubs = clubRepository.findAll();
                if (!clubs.isEmpty()) {
                    admin.setClub(clubs.get(0));
                } else {
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

        if (dto.getClubId() != null && dto.getClubId() > 0) {
            Club club = clubRepository.findById(dto.getClubId())
                    .orElseThrow(() -> new RuntimeException("Клуб не найден"));
            user.setClub(club);
        } else {
            user.setClub(null);
        }

        return userMapper.toDto(userRepository.save(user));
    }

    public void delete(Integer id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Пользователь не найден");
        }
        userRepository.deleteById(id);
    }

    // ==========================================================
    // ===== ВОССТАНОВЛЕНИЕ ПАРОЛЯ (6-значный код) =====
    // ==========================================================

    public String generateResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь с таким email не найден"));

        resetTokens.values().removeIf(data -> data.email.equals(email));

        String token = String.format("%06d", new Random().nextInt(999999));
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
        resetTokens.put(token, new TokenData(token, email, expiry));

        // ===== УСЛОВНАЯ ОТПРАВКА =====
        if ("production".equals(activeProfile)) {
            // На хостинге — выводим код в логи
            System.out.println("=========================================");
            System.out.println("Код для сброса пароля для " + email + ": " + token);
            System.out.println("Действителен 5 минут");
            System.out.println("=========================================");
        } else {
            // Локально — отправляем письмо через SMTP
            try {
                sendResetEmail(email, token);
            } catch (Exception e) {
                System.err.println("Ошибка отправки письма на " + email + ": " + e.getMessage());
                throw new RuntimeException("Не удалось отправить письмо. Проверьте настройки почты.");
            }
        }

        return token;
    }

    private void sendResetEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Восстановление пароля в FoxClub");
        message.setText(
                "Здравствуйте!\n\n" +
                "Вы запросили восстановление пароля в FoxClub.\n" +
                "Ваш код для сброса пароля: " + token + "\n\n" +
                "Код действителен 5 минут.\n\n" +
                "Если вы не запрашивали восстановление, просто проигнорируйте это письмо.\n\n" +
                "С уважением,\nКоманда FoxClub"
        );
        mailSender.send(message);
        System.out.println("Письмо с кодом отправлено на " + toEmail);
    }

    private String validateResetToken(String token) {
        TokenData data = resetTokens.get(token);
        if (data == null) {
            throw new RuntimeException("Недействительный код");
        }
        if (data.expiry.isBefore(LocalDateTime.now())) {
            resetTokens.remove(token);
            throw new RuntimeException("Срок действия кода истёк (5 минут)");
        }
        return data.email;
    }

    public void resetPasswordWithToken(String token, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("Пароль должен быть не менее 6 символов");
        }

        String email = validateResetToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetTokens.remove(token);
    }
}