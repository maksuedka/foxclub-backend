package by.foxclub.mapper;

import by.foxclub.dto.PurchasedAbonementDto;
import by.foxclub.entity.Abonement;
import by.foxclub.entity.PurchasedAbonement;
import by.foxclub.entity.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-16T16:31:04+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.5 (BellSoft)"
)
@Component
public class PurchasedAbonementMapperImpl implements PurchasedAbonementMapper {

    @Override
    public PurchasedAbonementDto toDto(PurchasedAbonement entity) {
        if ( entity == null ) {
            return null;
        }

        PurchasedAbonementDto purchasedAbonementDto = new PurchasedAbonementDto();

        purchasedAbonementDto.setUserId( entityUserId( entity ) );
        purchasedAbonementDto.setAbonementId( entityAbonementId( entity ) );
        purchasedAbonementDto.setAbonementName( entityAbonementName( entity ) );
        purchasedAbonementDto.setId( entity.getId() );
        purchasedAbonementDto.setPurchaseDate( entity.getPurchaseDate() );
        purchasedAbonementDto.setStartDate( entity.getStartDate() );
        purchasedAbonementDto.setEndDate( entity.getEndDate() );
        purchasedAbonementDto.setPriceAtPurchase( entity.getPriceAtPurchase() );

        return purchasedAbonementDto;
    }

    @Override
    public PurchasedAbonement toEntity(PurchasedAbonementDto dto) {
        if ( dto == null ) {
            return null;
        }

        PurchasedAbonement purchasedAbonement = new PurchasedAbonement();

        purchasedAbonement.setId( dto.getId() );
        purchasedAbonement.setPurchaseDate( dto.getPurchaseDate() );
        purchasedAbonement.setStartDate( dto.getStartDate() );
        purchasedAbonement.setEndDate( dto.getEndDate() );
        purchasedAbonement.setPriceAtPurchase( dto.getPriceAtPurchase() );

        return purchasedAbonement;
    }

    private Integer entityUserId(PurchasedAbonement purchasedAbonement) {
        if ( purchasedAbonement == null ) {
            return null;
        }
        User user = purchasedAbonement.getUser();
        if ( user == null ) {
            return null;
        }
        Integer id = user.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private Integer entityAbonementId(PurchasedAbonement purchasedAbonement) {
        if ( purchasedAbonement == null ) {
            return null;
        }
        Abonement abonement = purchasedAbonement.getAbonement();
        if ( abonement == null ) {
            return null;
        }
        Integer id = abonement.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String entityAbonementName(PurchasedAbonement purchasedAbonement) {
        if ( purchasedAbonement == null ) {
            return null;
        }
        Abonement abonement = purchasedAbonement.getAbonement();
        if ( abonement == null ) {
            return null;
        }
        String name = abonement.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }
}
