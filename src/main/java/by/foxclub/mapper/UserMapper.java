package by.foxclub.mapper;

import by.foxclub.dto.UserDto;
import by.foxclub.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    @Mapping(source = "club.id", target = "clubId")
    UserDto toDto(User user);

    @Mapping(target = "club", ignore = true)
    @Mapping(target = "password", ignore = true)
    User toEntity(UserDto dto);
}