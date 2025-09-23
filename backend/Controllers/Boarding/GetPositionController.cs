using Microsoft.AspNetCore.Mvc;
using FlightFocus.Infrastructure;
using Npgsql;

namespace FlightFocus.Controllers
{
    [ApiController]
    public class GetPositionController : ControllerBase
    {
        private readonly Postgresql _connection;
        private readonly Authentication _authentication;

        public GetPositionController(Postgresql connection, Authentication authentication)
        {
            _connection = connection;
            _authentication = authentication;
        }

        [HttpGet("api/boarding/position")]
        public async Task<IActionResult> GetPosition()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            string? token = null;
        
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
            {
                token = authHeader.Substring("Bearer ".Length).Trim();
            }

            int? id = _authentication.VerifyToken(token);

            if(id != null)
            {
                await using(var conn = await _connection.GetOpenConnectionAsync())
                {
                    await using(var position = new NpgsqlCommand("SELECT * FROM users WHERE id = @id", conn))
                    {
                        position.Parameters.AddWithValue("id", id);

                        await using(var reader = await position.ExecuteReaderAsync())
                        {
                            await reader.ReadAsync();
                            return Ok(reader.GetString(reader.GetOrdinal("airport")));
                        }
                    }
                }
            } else 
            {
                return Unauthorized();
            }
        }
    }
}