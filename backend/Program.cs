using FlightFocus.Infrastructure;
using DotNetEnv;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<Postgresql>();
builder.Services.AddSingleton<Mail>();
builder.Services.AddSingleton<Authentication>();

var app = builder.Build();

app.MapControllers();

app.Run();