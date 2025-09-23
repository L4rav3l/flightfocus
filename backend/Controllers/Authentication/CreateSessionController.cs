using Microsoft.AspNetCore.Mvc;
using System;
using System.Text;
using System.Text.RegularExpressions;
using FlightFocus.Infrastructure;
using Npgsql;
using MimeKit;

namespace FlightFocus.Controllers
{

    public class CreateSessionRequest
    {
        public required string Email{get;set;}
    }

    [ApiController]
    public class CreateSessionController : ControllerBase
    {
        private readonly Postgresql _connection;
        private readonly Mail _mail;

        public CreateSessionController(Postgresql connection, Mail mail)
        {
            _connection = connection;
            _mail = mail;
        }

        [HttpPost("api/auth/create_session")]
        public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request)
        {

            string pattern = @"^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$";

            bool isValid = Regex.IsMatch(request.Email, pattern);

            if (!isValid)
            {
                return Conflict(new { error = 1 });
            }

            Guid myGuid = Guid.NewGuid();
            int? id = null;
            bool? registered = null;

            await using(var conn = await _connection.GetOpenConnectionAsync())
            {
                await using(var transaction = await conn.BeginTransactionAsync())
                {
                    try
                    {
                    await using(var check = new NpgsqlCommand("SELECT * FROM users WHERE email = @email", conn, transaction))
                    {
                        check.Parameters.AddWithValue("email", request.Email.ToLower());

                        await using(var reader = await check.ExecuteReaderAsync())
                        {
                            if(await reader.ReadAsync())
                            {
                                id = reader.GetInt32(reader.GetOrdinal("id"));
                            } else {
                                registered = false;
                            }
                        }
                    }

                    if(registered == false)
                    {
                        await using(var register = new NpgsqlCommand("INSERT INTO users (email) VALUES (@email) RETURNING id", conn, transaction))
                        {
                            register.Parameters.AddWithValue("email", request.Email.ToLower());

                            await using(var reader = await register.ExecuteReaderAsync())
                            {
                                if(await reader.ReadAsync())
                                {
                                    id = reader.GetInt32(reader.GetOrdinal("id"));
                                }
                            }
                        }
                    }

                    await using(var update = new NpgsqlCommand("INSERT INTO session (code, expired, userid, uuid) VALUES (@code, @expired, @userid, @uuid)", conn, transaction))
                    {
                        Random rnd = new Random();
                        int randomDigit = rnd.Next(100000, 999999);

                        update.Parameters.AddWithValue("code", randomDigit);
                        update.Parameters.AddWithValue("expired", DateTime.UtcNow.AddMinutes(15));
                        update.Parameters.AddWithValue("userid", id);
                        update.Parameters.AddWithValue("uuid", myGuid);
                        
                        using(var SmtpClient = _mail.CreateSMTPClient())
                        {
                            var message = new MimeMessage();
                            message.From.Add(new MailboxAddress("Flight Focus", Environment.GetEnvironmentVariable("SMTP_USERNAME")));
                            message.To.Add(new MailboxAddress("", request.Email));
                            message.Subject = "Login Code";
                            message.Body = new TextPart("plain")
                            {
                                Text =
                                "Hi, \n" +
                                $"Your code: {randomDigit}, \n" +
                                "Sincerely, Flight Focus"
                            };

                            SmtpClient.Send(message);
                            SmtpClient.Disconnect(true);
                        }

                        await update.ExecuteNonQueryAsync();
                        }
                        
                        await transaction.CommitAsync();
                        return Ok(new {session = myGuid});
                    }
                    catch(Exception ex)
                    {
                        Console.WriteLine(ex);
                        await transaction.RollbackAsync();
                        return BadRequest(new {error = 0});
                    }
                }
            }
        }
    }
}

