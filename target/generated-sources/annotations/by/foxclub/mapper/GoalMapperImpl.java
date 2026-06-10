package by.foxclub.mapper;

import by.foxclub.dto.GoalDto;
import by.foxclub.entity.Goal;
import by.foxclub.entity.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-10T18:30:03+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.5 (BellSoft)"
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
        goalDto.setId( goal.getId() );
        goalDto.setType( goal.getType() );
        goalDto.setTargetValue( goal.getTargetValue() );
        goalDto.setCurrentValue( goal.getCurrentValue() );
        goalDto.setStartDate( goal.getStartDate() );
        goalDto.setEndDate( goal.getEndDate() );
        goalDto.setDescription( goal.getDescription() );

        return goalDto;
    }

    @Override
    public Goal toEntity(GoalDto dto) {
        if ( dto == null ) {
            return null;
        }

        Goal goal = new Goal();

        goal.setId( dto.getId() );
        goal.setType( dto.getType() );
        goal.setTargetValue( dto.getTargetValue() );
        goal.setCurrentValue( dto.getCurrentValue() );
        goal.setStartDate( dto.getStartDate() );
        goal.setEndDate( dto.getEndDate() );
        goal.setDescription( dto.getDescription() );

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
