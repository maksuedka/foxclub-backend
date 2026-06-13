package by.foxclub.service;

import by.foxclub.dto.AdminDto;
import by.foxclub.entity.Admin;
import by.foxclub.entity.Club;
import by.foxclub.mapper.AdminMapper;
import by.foxclub.repository.AdminRepository;
import by.foxclub.repository.ClubRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final AdminRepository adminRepository;
    private final ClubRepository clubRepository;
    private final AdminMapper adminMapper;
    private final PasswordEncoder passwordEncoder;

    public List<AdminDto> getAll() {
        return adminRepository.findAll().stream()
                .map(adminMapper::toDto)
                .collect(Collectors.toList());
    }

    public AdminDto getById(Integer id) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Администратор не найден"));
        return adminMapper.toDto(admin);
    }

    public AdminDto create(AdminDto dto) {
        Club club = clubRepository.findById(dto.getClubId())
                .orElseThrow(() -> new RuntimeException("Клуб не найден"));

        Admin admin = adminMapper.toEntity(dto);
        admin.setClub(club);
        // Шифруем пароль при создании
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            admin.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        return adminMapper.toDto(adminRepository.save(admin));
    }

    public AdminDto update(Integer id, AdminDto dto) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Администратор не найден"));

        admin.setFirstName(dto.getFirstName());
        admin.setLastName(dto.getLastName());

        // Обновляем пароль, если передан непустой
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            admin.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        if (dto.getClubId() != null) {
            Club club = clubRepository.findById(dto.getClubId())
                    .orElseThrow(() -> new RuntimeException("Клуб не найден"));
            admin.setClub(club);
        }

        return adminMapper.toDto(adminRepository.save(admin));
    }

    public void delete(Integer id) {
        if (!adminRepository.existsById(id)) {
            throw new RuntimeException("Администратор не найден");
        }
        adminRepository.deleteById(id);
    }
}