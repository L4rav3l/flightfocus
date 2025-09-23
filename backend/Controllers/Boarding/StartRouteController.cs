using Microsoft.AspNetCore.Mvc;
using FlightFocus.Infrastructure;
using Npgsql;

namespace FlightFoucus.Controllers
{
    public class StartRouteRequest
    {
        public required string Airport{get;set;}
        public required DateTime ArrivedDate{get;set;}
    }

    [ApiController]
    public class StartRouteController : ControllerBase
    {
        private readonly Authentication _authentication;
        private readonly Postgresql _connection;

        public StartRouteController(Authentication authentication, Postgresql connection)
        {
            _authentication = authentication;
            _connection = connection;
        }

        [HttpPost("api/boarding/start")]
        public async Task<IActionResult> StartRoute([FromBody] StartRouteRequest request)
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
                    await using(var transaction = await conn.BeginTransactionAsync())
                    {
                        try
                        {
                        
                        string? departure = null;

                        await using(var data = new NpgsqlCommand("SELECT * FROM users WHERE id = @userid", conn, transaction))
                        {
                            data.Parameters.AddWithValue("userid", id);

                            await using(var reader = await data.ExecuteReaderAsync())
                            {
                                await reader.ReadAsync();
                                departure = reader.GetString(reader.GetOrdinal("airport"));
                            }
                        }

                        await using(var way = new NpgsqlCommand("INSERT INTO ways (userid, departure, arrival, arrivaltime) VALUES (@userid, @departure, @arrival, @arrivaltime)", conn, transaction))
                        {
                            way.Parameters.AddWithValue("userid", id);
                            way.Parameters.AddWithValue("departure", departure);
                            way.Parameters.AddWithValue("arrival", request.Airport);
                            way.Parameters.AddWithValue("arrivaltime", request.ArrivedDate.ToUniversalTime());

                            await way.ExecuteNonQueryAsync();
                        }

                        await transaction.CommitAsync();
                        return Ok();
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        return BadRequest();
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