using Microsoft.AspNetCore.Mvc;
using FlightFocus.Infrastructure;
using Npgsql;

namespace FlightFocus.Controllers
{   
    [ApiController]
    public class GetHistoryController : ControllerBase
    {
        private readonly Authentication _authentication;
        private readonly Postgresql _connection;

        public GetHistoryController(Authentication authentication, Postgresql connection)
        {
            _authentication = authentication;
            _connection = connection;
        }

        [HttpGet("api/boarding/history")]
        public async Task<IActionResult> GetHistory()
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
                            var history = new List<object>();

                            await using(var historyrequest = new NpgsqlCommand("SELECT * FROM ways WHERE userid = @id AND completed = true", conn))
                            {
                                historyrequest.Parameters.AddWithValue("id", id);

                                await using(var reader = await historyrequest.ExecuteReaderAsync())
                                {
                                    while(await reader.ReadAsync())
                                    {
                                        var histories = new {
                                            arrival = reader.GetString(reader.GetOrdinal("arrival")),
                                            arrivaldate = reader.GetDateTime(reader.GetOrdinal("arrivaltime")),
                                            departure = reader.GetString(reader.GetOrdinal("departure"))
                                        };

                                        history.Add(histories);
                                    }

                                    return Ok(history);
                                }
                            }
                        }
                    } else {
                        return Unauthorized();
                    }
                }
            }
        }