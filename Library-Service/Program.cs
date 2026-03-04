using Library_Service.Models.Data;
using Library_Service.Services.Author;
using Library_Service.Services.Book;
using Library_Service.Services.Loan;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// CORS origins from env
var configuredOrigins = builder.Configuration["Cors:AllowedOrigins"];

if (string.IsNullOrWhiteSpace(configuredOrigins))
    throw new InvalidOperationException("A configuração obrigatória 'Cors:AllowedOrigins' não foi informada.");

var allowedOrigins = configuredOrigins
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

if (allowedOrigins.Length == 0)
    throw new InvalidOperationException("A configuração 'Cors:AllowedOrigins' está vazia ou inválida.");

// CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCors", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// PostgreSQL connection string
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// PostgreSQL Connection
builder.Services.AddDbContext<AppDbContext>(opts => opts.UseNpgsql(connectionString));

builder.Services.AddScoped<IAuthorService, AuthorService>();
builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<ILoanService, LoanService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "Library Service v1"));
}

app.UseHttpsRedirection();

app.UseCors("FrontendCors");

app.UseAuthorization();

app.MapControllers();

// Apply Migrations:
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.Run();