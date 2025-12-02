using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Entities;

[Table("items", Schema = "public")]
public class ItemEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("effect")]
    public string? Effect { get; set; }

    [Column("requirement")]
    public string? Requirement { get; set; }

    [Column("image")]
    public string? Image { get; set; }

    [Column("type")]
    public string? Type { get; set; }

    [Column("sub_type")]
    public string? SubType { get; set; }

    [Column("is_masked")]
    public bool IsMasked { get; set; }

    [Column("is_tradable")]
    public bool IsTradable { get; set; }

    [Column("is_found_in_city")]
    public bool IsFoundInCity { get; set; }

    [Column("value_vendor_country")]
    public string? ValueVendorCountry { get; set; }

    [Column("value_vendor_name")]
    public string? ValueVendorName { get; set; }

    [Column("value_buy_price")]
    public long? ValueBuyPrice { get; set; }

    [Column("value_sell_price")]
    public long? ValueSellPrice { get; set; }

    [Column("value_market_price")]
    public long? ValueMarketPrice { get; set; }

    [Column("circulation")]
    public long? Circulation { get; set; }

    [Column("details_category")]
    public string? DetailsCategory { get; set; }

    [Column("details_stealth_level")]
    public decimal? DetailsStealthLevel { get; set; }

    [Column("details_base_stats_damage")]
    public int? DetailsBaseStatsDamage { get; set; }

    [Column("details_base_stats_accuracy")]
    public int? DetailsBaseStatsAccuracy { get; set; }

    [Column("details_base_stats_armor")]
    public int? DetailsBaseStatsArmor { get; set; }

    [Column("details_ammo_id")]
    public int? DetailsAmmoId { get; set; }

    [Column("details_ammo_name")]
    public string? DetailsAmmoName { get; set; }

    [Column("details_ammo_magazine_rounds")]
    public int? DetailsAmmoMagazineRounds { get; set; }

    [Column("details_ammo_rate_of_fire_minimum")]
    public int? DetailsAmmoRateOfFireMinimum { get; set; }

    [Column("details_ammo_rate_of_fire_maximum")]
    public int? DetailsAmmoRateOfFireMaximum { get; set; }

    [Column("last_updated")]
    public required DateTime LastUpdated { get; set; }

    public ICollection<ItemChangeLogEntity> ChangeLogs { get; set; } = [];
    public ICollection<ForeignStockItemEntity> ForeignStockItems { get; set; } = [];

    public ItemDto AsDto()
    {
        return new ItemDto
        {
            Id = Id,
            Name = Name,
            Description = Description,
            Effect = Effect,
            Requirement = Requirement,
            Image = Image,
            Type = Type,
            SubType = SubType,
            IsMasked = IsMasked,
            IsTradable = IsTradable,
            IsFoundInCity = IsFoundInCity,
            ValueVendorCountry = ValueVendorCountry,
            ValueVendorName = ValueVendorName,
            ValueBuyPrice = ValueBuyPrice,
            ValueSellPrice = ValueSellPrice,
            ValueMarketPrice = ValueMarketPrice,
            Circulation = Circulation,
            DetailsCategory = DetailsCategory,
            DetailsStealthLevel = DetailsStealthLevel,
            DetailsBaseStatsDamage = DetailsBaseStatsDamage,
            DetailsBaseStatsAccuracy = DetailsBaseStatsAccuracy,
            DetailsBaseStatsArmor = DetailsBaseStatsArmor,
            DetailsAmmoId = DetailsAmmoId,
            DetailsAmmoName = DetailsAmmoName,
            DetailsAmmoMagazineRounds = DetailsAmmoMagazineRounds,
            DetailsAmmoRateOfFireMinimum = DetailsAmmoRateOfFireMinimum,
            DetailsAmmoRateOfFireMaximum = DetailsAmmoRateOfFireMaximum,
            LastUpdated = LastUpdated
        };
    }
}
