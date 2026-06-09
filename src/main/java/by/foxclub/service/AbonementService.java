package by.foxclub.service;

import by.foxclub.dto.AbonementDto;
import by.foxclub.entity.Abonement;
import by.foxclub.mapper.AbonementMapper;
import by.foxclub.repository.AbonementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AbonementService {

    private final AbonementRepository repository;
    private final AbonementMapper mapper;

    public List<AbonementDto> getAll() {
        return repository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public AbonementDto getById(Integer id) {
        return repository.findById(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new RuntimeException("Abonement not found"));
    }

    @Transactional
    public AbonementDto create(AbonementDto dto) {
        Abonement entity = mapper.toEntity(dto);
        Abonement saved = repository.save(entity);
        return mapper.toDto(saved);
    }

    @Transactional
    public AbonementDto update(Integer id, AbonementDto dto) {
        Abonement existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Abonement not found"));

        if (dto.getName() != null) existing.setName(dto.getName());
        if (dto.getPrice() != null) existing.setPrice(dto.getPrice());
        if (dto.getDuration() != null) existing.setDuration(dto.getDuration());
        if (dto.getDate() != null) existing.setDate(dto.getDate());

        Abonement saved = repository.save(existing);
        return mapper.toDto(saved);
    }

    @Transactional
    public void delete(Integer id) {
        repository.deleteById(id);
    }
}