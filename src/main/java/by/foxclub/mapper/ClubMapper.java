package by.foxclub.mapper;

import by.foxclub.dto.ClubDto;
import by.foxclub.entity.Club;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface ClubMapper {

    ClubMapper INSTANCE = Mappers.getMapper(ClubMapper.class);

    ClubDto toDto(Club club);

    Club toEntity(ClubDto dto);
}