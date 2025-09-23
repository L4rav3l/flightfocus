using Microsoft.AspNetCore.Mvc;
using FlightFocus.Infrastructure;
using Npgsql;

namespace FlightFocus.Controllers
{
    public class CompleteRouteRequest
    {
        public required string Departure {get;set;}
        public required string Arrival {get;set;}
        public required DateTime ArrivedDate {get;set;}
    }

    [ApiController]
    public class CompleteRouteController : ControllerBase
    {
        private readonly Authentication _authentication;
        private readonly Postgresql _connection;

        public CompleteRouteController(Authentication authentication, Postgresql connection)
        {
            _authentication = authentication;
            _connection = connection;
        }

        [HttpPost("api/boarding/complete")]
        public async Task<IActionResult> CompleteRoute([FromBody] CompleteRouteRequest request)
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
                        await using(var update = new NpgsqlCommand("UPDATE ways SET completed = true WHERE userid = @userid AND departure = @departure AND arrival = @arrival AND arrivaltime = @arrivaltime", conn, transaction))
                        {
                            update.Parameters.AddWithValue("userid", id);
                            update.Parameters.AddWithValue("departure", request.Departure);
                            update.Parameters.AddWithValue("arrival", request.Arrival);
                            update.Parameters.AddWithValue("arrivaltime", request.ArrivedDate.ToUniversalTime());

                            await update.ExecuteNonQueryAsync();
                        }
                        
                        await using(var userdata = new NpgsqlCommand("UPDATE users SET airport = @airport WHERE id = @userid", conn, transaction))
                        {
                            userdata.Parameters.AddWithValue("airport", request.Arrival);
                            userdata.Parameters.AddWithValue("userid", id);

                            await userdata.ExecuteNonQueryAsync();
                        }
                        await transaction.CommitAsync();
                        return Ok();
                    
                    }

                    catch(Exception ex)
                    {
                        Console.WriteLine(ex);
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