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
    @Mapping(target = "initialValue", ignore = true)
    @Mapping(target = "unit", ignore = true)
    @Mapping(target = "history", ignore = true)
    @Mapping(target = "exercise", ignore = true)
    @Mapping(target = "fitnessLevel", ignore = true)
    @Mapping(target = "userComment", ignore = true)
    GoalDto toDto(Goal goal);

    @Mapping(target = "user", ignore = true)
    @Mapping(target = "description", source = "description")  // явно копируем
    Goal toEntity(GoalDto dto);
}