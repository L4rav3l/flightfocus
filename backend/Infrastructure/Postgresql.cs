using Npgsql;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace FlightFocus.Infrastructure {

    public class Postgresql {

        private readonly string _connectionString;
        
        public Postgresql() {
            _connectionString = Environment.GetEnvironmentVariable("PSQL_CONNECTION");
        }

        public async Task<NpgsqlConnection> GetOpenConnectionAsync()
        {
            var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();
            return conn;
        }
    }
}