using System.Diagnostics.CodeAnalysis;
using TornTools.Core.Models.TornItems;

namespace TornTools.Core.DataTransferObjects;
public class ItemDto
{
    public required int Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? Effect { get; set; }
    public string? Requirement { get; set; }
    public string? Image { get; set; }
    public string? Type { get; set; }
    public string? SubType { get; set; }
    public required bool IsMasked { get; set; }
    public required bool IsTradable { get; set; }
    public required bool IsFoundInCity { get; set; }
    public string? ValueVendorCountry { get; set; }
    public string? ValueVendorName { get; set; }
    public long? ValueBuyPrice { get; set; }
    public long? ValueSellPrice { get; set; }
    public long? ValueMarketPrice { get; set; }
    public long? Circulation { get; set; }
    public string? DetailsCategory { get; set; }
    public decimal? DetailsStealthLevel { get; set; }
    public int? DetailsBaseStatsDamage { get; set; }
    public int? DetailsBaseStatsAccuracy { get; set; }
    public int? DetailsBaseStatsArmor { get; set; }
    public int? DetailsAmmoId { get; set; }
    public string? DetailsAmmoName { get; set; }
    public int? DetailsAmmoMagazineRounds { get; set; }
    public int? DetailsAmmoRateOfFireMinimum { get; set; }
    public int? DetailsAmmoRateOfFireMaximum { get; set; }

    public ItemDto() { }

    [SetsRequiredMembers]
    public ItemDto(Item item)
    {
        Id = item.Id;
        Name = item.Name;
        Description = item.Description;
        Effect = item.Effect;
        Requirement = item.Requirement;
        Image = item.Image;
        Type = item.Type;
        SubType = item.SubType;
        IsMasked = item.IsMasked;
        IsTradable = item.IsTradable;
        IsFoundInCity = item.IsFoundInCity;
        ValueVendorCountry = item.Value.Vendor?.Country;
        ValueVendorName = item.Value.Vendor?.Name;
        ValueBuyPrice = item.Value.BuyPrice;
        ValueSellPrice = item.Value.SellPrice;
        ValueMarketPrice = item.Value.MarketPrice;
        Circulation = item.Circulation;
        DetailsCategory = item.Details?.Category;
        DetailsStealthLevel = item.Details?.StealthLevel;
        DetailsBaseStatsDamage = item.Details?.BaseStats?.Damage;
        DetailsBaseStatsAccuracy = item.Details?.BaseStats?.Accuracy;
        DetailsBaseStatsArmor = item.Details?.BaseStats?.Armor;
        DetailsAmmoId = item.Details?.Ammo?.Id;
        DetailsAmmoName = item.Details?.Ammo?.Name;
        DetailsAmmoMagazineRounds = item.Details?.Ammo?.MagazineRounds;
        DetailsAmmoRateOfFireMinimum = item.Details?.Ammo?.RateOfFire?.Minimum;
        DetailsAmmoRateOfFireMaximum = item.Details?.Ammo?.RateOfFire?.Maximum;
    }
}
