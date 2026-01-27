using Cmf.LightBusinessObjects.Infrastructure;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace IndustrialEquipmentSimulator.Services
{
    public class TokenService : ITokenService
    {
        private readonly ClientConfiguration _clientConfiguration;
        private string? _refreshToken;
        private string? _accessToken;

        public TokenService(IOptions<ClientConfiguration> clientConfiguration)
        {
            _clientConfiguration = clientConfiguration.Value;
            _refreshToken = _clientConfiguration.SecurityAccessToken;
            _accessToken = AccessTokenAsync().GetAwaiter().GetResult();
        }

        public string? RefreshToken
        {
            get => _refreshToken;
            set => _refreshToken = value;
        }

        public string? AccessToken
        {
            get => _accessToken;
            set => _accessToken = value;
        }

        public async Task<string?> GetValidTokenAsync()
        {
            return _accessToken;
        }

        public async Task RefreshTokenAsync()
        {
            var http = new HttpClient();
            var url = $"https://{_clientConfiguration.HostAddress}/SecurityPortal/api/tenant/{_clientConfiguration.ClientTenantName}/oauth2/token";

            var form = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "client_id", _clientConfiguration.ClientId },
                { "grant_type", "refresh_token" },
                { "refresh_token", _clientConfiguration.SecurityAccessToken }
            });

            var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = form };
            request.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));

            var response = await http.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var body = await response.Content.ReadAsStringAsync();
            _refreshToken = body;
        }

        public async Task<string> AccessTokenAsync()
        {
            var http = new HttpClient();
            var url = $"https://{_clientConfiguration.HostAddress}/SecurityPortal/api/tenant/{_clientConfiguration.ClientTenantName}/oauth2/token";

            var form = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "client_id", _clientConfiguration.ClientId },
                { "grant_type", "refresh_token" },
                { "refresh_token", _clientConfiguration.SecurityAccessToken }
            });

            var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = form };
            request.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));

            var response = await http.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var body = await response.Content.ReadAsStringAsync();
            var tokenResponse = JsonSerializer.Deserialize<JsonElement>(body);
            var accessToken = tokenResponse.GetProperty("access_token").GetString();

            _accessToken = accessToken;
            return accessToken;
        }
    }
}