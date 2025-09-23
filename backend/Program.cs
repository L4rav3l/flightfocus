using FlightFocus.Infrastructure;
using DotNetEnv;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

// CORS beállítás: bárhonnan engedélyezett
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()    // bárhonnan
              .AllowAnyMethod()    // bármilyen HTTP metódus (GET, POST, stb.)
              .AllowAnyHeader();   // bármilyen header
    });
});

builder.Services.AddControllers();
builder.Services.AddSingleton<Postgresql>();
builder.Services.AddSingleton<Mail>();
builder.Services.AddSingleton<Authentication>();

var app = builder.Build();

// CORS middleware hozzáadása
app.UseCors("AllowAll");

app.MapControllers();

app.Run();
