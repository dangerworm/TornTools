using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TornTools.Core.Configurations;

namespace TornTools.Api.Authentication;

public class JwtService(JwtConfiguration config)
{
  public string GenerateToken(long userId, string name)
  {
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config.Secret));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var claims = new[]
    {
      new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
      new Claim(JwtRegisteredClaimNames.Name, name),
      new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

    var token = new JwtSecurityToken(
        issuer: config.Issuer,
        audience: config.Audience,
        claims: claims,
        expires: DateTime.UtcNow.AddDays(config.ExpiryDays),
        signingCredentials: credentials
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
  }
}
