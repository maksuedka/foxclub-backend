package by.foxclub.service;

import by.foxclub.dto.ClubDto;
import by.foxclub.entity.Club;
import by.foxclub.mapper.ClubMapper;
import by.foxclub.repository.ClubRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClubService {

    private final ClubRepository clubRepository;
    private final ClubMapper clubMapper;

    public List<ClubDto> getAll() {
        return clubRepository.findAll().stream()
                .map(clubMapper::toDto)
                .collect(Collectors.toList());
    }

    public ClubDto getById(Integer id) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Клуб не найден"));
        return clubMapper.toDto(club);
    }

    public ClubDto create(ClubDto dto) {
        // Проверка на уникальность названия
        if (clubRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Клуб с таким названием уже существует");
        }

        Club club = clubMapper.toEntity(dto);
        return clubMapper.toDto(clubRepository.save(club));
    }

    public ClubDto update(Integer id, ClubDto dto) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Клуб не найден"));

        club.setName(dto.getName());
        club.setAddress(dto.getAddress());
        club.setContacts(dto.getContacts());
        club.setWorkingHours(dto.getWorkingHours());
        // imageUrl удалён

        return clubMapper.toDto(clubRepository.save(club));
    }

    public void delete(Integer id) {
        if (!clubRepository.existsById(id)) {
            throw new RuntimeException("Клуб не найден");
        }
        clubRepository.deleteById(id);
    }

    // Метод для поиска по городу
    public List<ClubDto> getClubsByCity(String city) {
        return clubRepository.findByCityInAddress(city)
                .stream()
                .map(clubMapper::toDto)
                .collect(Collectors.toList());
    }
}