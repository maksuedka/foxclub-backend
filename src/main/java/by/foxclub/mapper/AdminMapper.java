package by.foxclub.mapper;

import by.foxclub.dto.AdminDto;
import by.foxclub.entity.Admin;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface AdminMapper {

    AdminMapper INSTANCE = Mappers.getMapper(AdminMapper.class);

    @Mapping(source = "club.id", target = "clubId")
    AdminDto toDto(Admin admin);

    @Mapping(source = "clubId", target = "club.id")
    Admin toEntity(AdminDto dto);
}