package by.foxclub.service;

import by.foxclub.dto.LoginRequest;
import by.foxclub.dto.RegisterRequest;
import by.foxclub.dto.UserDto;
import by.foxclub.entity.User;
import by.foxclub.entity.Club;
import by.foxclub.mapper.UserMapper;
import by.foxclub.repository.UserRepository;
import by.foxclub.repository.ClubRepository;
import lombok.RequiredArgsConstructor;
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
    private final UserMapper userMapper;

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

        Club club = clubRepository.findById(request.getClubId())
                .orElseThrow(() -> new RuntimeException("Клуб не найден"));

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setClub(club);
        // abonementId = null при регистрации

        return userMapper.toDto(userRepository.save(user));
    }

    public UserDto login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Неверный пароль");
        }

        return userMapper.toDto(user);
    }

    public UserDto update(Integer id, UserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setAbonementId(dto.getAbonementId());

        if (dto.getClubId() != null) {
            Club club = clubRepository.findById(dto.getClubId())
                    .orElseThrow(() -> new RuntimeException("Клуб не найден"));
            user.setClub(club);
        }

        return userMapper.toDto(userRepository.save(user));
    }

    public void delete(Integer id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Пользователь не найден");
        }
        userRepository.deleteById(id);
    }
}