using Microsoft.AspNetCore.Mvc;
using FlightFocus.Infrastructure;
using Npgsql; 
namespace FlightFocus.Controllers
{

    public class CompleteSessionRequest
    {
        public required string Session{get;set;}
        public required int Code {get;set;}
    }

    [ApiController]
    public class CompleteSessionController : ControllerBase
    {
        private readonly Postgresql _connection;
        private readonly Authentication _authentication;

        public CompleteSessionController(Postgresql connection, Authentication authentication)
        {
            _connection = connection;
            _authentication = authentication;
        }

        [HttpPost("api/auth/complete_session")]
        public async Task<IActionResult> CompleteSession([FromBody] CompleteSessionRequest request)
        {
            await using(var conn = await _connection.GetOpenConnectionAsync())
            {
                await using(var transaction = await conn.BeginTransactionAsync())
                {
                    try
                    {
                        await using(var data = new NpgsqlCommand("SELECT * FROM session WHERE code = @code AND uuid = @session AND expired >= @date", conn, transaction))
                        {
                            data.Parameters.AddWithValue("code", request.Code);
                            data.Parameters.AddWithValue("session", request.Session);
                            data.Parameters.AddWithValue("date", DateTime.UtcNow);

                            await using(var reader = await data.ExecuteReaderAsync())
                            {
                                if(await reader.ReadAsync())
                                {
                                    return Ok(_authentication.GenerateToken(reader.GetInt32(reader.GetOrdinal("userid"))));
                                } else {
                                    return Unauthorized();
                                }
                            }
                        }
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new {error = 0});
                    }
                }
            }
        }
    }
}