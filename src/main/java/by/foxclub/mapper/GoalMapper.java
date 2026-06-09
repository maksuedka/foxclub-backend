package by.foxclub.mapper;

import by.foxclub.dto.GoalDto;
import by.foxclub.entity.Goal;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface GoalMapper {

    GoalMapper INSTANCE = Mappers.getMapper(GoalMapper.class);

    @Mapping(source = "user.id", target = "userId")
    GoalDto toDto(Goal goal);

    @Mapping(target = "user", ignore = true)
    Goal toEntity(GoalDto dto);
}