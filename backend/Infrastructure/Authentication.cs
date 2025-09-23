using System;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using Npgsql;

namespace FlightFocus.Infrastructure
{
    public class Authentication
    {
        public string GenerateToken(int id)
        {
            var securitykey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("JWT_SECRET")));
            var credentials = new SigningCredentials(securitykey, SecurityAlgorithms.HmacSha256);

            var claims = new []
            {
                new Claim("id", id.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: "FF:API",
                audience: "FF:USERS",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public int? VerifyToken(string token)
        {
            var securitykey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("JWT_SECRET")));
            
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = securitykey,
                ValidateIssuer = true,
                ValidIssuer = "FF:API",
                ValidateAudience = true,
                ValidAudience = "FF:USERS",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

                try {
                    var principal = new JwtSecurityTokenHandler().ValidateToken(token, validationParameters, out SecurityToken validatedtoken);
                    var id = int.Parse(principal.FindFirst("id").Value);

                    return id;
                }

                catch {
                    return null;
                }
        }
    }
}