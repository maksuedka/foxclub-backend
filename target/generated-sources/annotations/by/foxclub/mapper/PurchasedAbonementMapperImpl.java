package by.foxclub.mapper;

import by.foxclub.dto.PurchasedAbonementDto;
import by.foxclub.entity.Abonement;
import by.foxclub.entity.PurchasedAbonement;
import by.foxclub.entity.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-13T18:55:30+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
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
        purchasedAbonementDto.setEndDate( entity.getEndDate() );
        purchasedAbonementDto.setId( entity.getId() );
        purchasedAbonementDto.setPriceAtPurchase( entity.getPriceAtPurchase() );
        purchasedAbonementDto.setPurchaseDate( entity.getPurchaseDate() );
        purchasedAbonementDto.setStartDate( entity.getStartDate() );

        return purchasedAbonementDto;
    }

    @Override
    public PurchasedAbonement toEntity(PurchasedAbonementDto dto) {
        if ( dto == null ) {
            return null;
        }

        PurchasedAbonement purchasedAbonement = new PurchasedAbonement();

        purchasedAbonement.setEndDate( dto.getEndDate() );
        purchasedAbonement.setId( dto.getId() );
        purchasedAbonement.setPriceAtPurchase( dto.getPriceAtPurchase() );
        purchasedAbonement.setPurchaseDate( dto.getPurchaseDate() );
        purchasedAbonement.setStartDate( dto.getStartDate() );

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
