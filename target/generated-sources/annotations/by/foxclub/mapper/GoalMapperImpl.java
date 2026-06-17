package by.foxclub.mapper;

import by.foxclub.dto.GoalDto;
import by.foxclub.entity.Goal;
import by.foxclub.entity.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-17T03:54:26+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class GoalMapperImpl implements GoalMapper {

    @Override
    public GoalDto toDto(Goal goal) {
        if ( goal == null ) {
            return null;
        }

        GoalDto goalDto = new GoalDto();

        goalDto.setUserId( goalUserId( goal ) );
        goalDto.setCurrentValue( goal.getCurrentValue() );
        goalDto.setDescription( goal.getDescription() );
        goalDto.setEndDate( goal.getEndDate() );
        goalDto.setId( goal.getId() );
        goalDto.setStartDate( goal.getStartDate() );
        goalDto.setTargetValue( goal.getTargetValue() );
        goalDto.setType( goal.getType() );

        return goalDto;
    }

    @Override
    public Goal toEntity(GoalDto dto) {
        if ( dto == null ) {
            return null;
        }

        Goal goal = new Goal();

        goal.setDescription( dto.getDescription() );
        goal.setCurrentValue( dto.getCurrentValue() );
        goal.setEndDate( dto.getEndDate() );
        goal.setId( dto.getId() );
        goal.setStartDate( dto.getStartDate() );
        goal.setTargetValue( dto.getTargetValue() );
        goal.setType( dto.getType() );

        return goal;
    }

    private Integer goalUserId(Goal goal) {
        if ( goal == null ) {
            return null;
        }
        User user = goal.getUser();
        if ( user == null ) {
            return null;
        }
        Integer id = user.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }
}
