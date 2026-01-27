namespace IndustrialEquipmentSimulator.Services
{
    public interface ITokenService
    {
        string? AccessToken { get; set; }
        string? RefreshToken { get; set; }
        Task<string?> GetValidTokenAsync();
        Task RefreshTokenAsync();
    }
}