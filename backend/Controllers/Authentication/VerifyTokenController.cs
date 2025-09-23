using Microsoft.AspNetCore.Mvc;
using FlightFocus.Infrastructure;

namespace FlightFocus.Controllers
{
    [ApiController]
    public class VerifyTokenController : ControllerBase
    {
        private readonly Authentication _authentication;

        public VerifyTokenController(Authentication authentication)
        {
            _authentication = authentication;
        }

        [HttpPost("api/auth/verify")]
        public IActionResult VerifyToken()
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
                return Ok();
            } else 
            {
                return Unauthorized();
            }
        }
    }
}